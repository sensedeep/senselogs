/*
    Senselogs - Simple, fast, dynamic logging for serverless
 */

const DefaultFilter = ['fatal', 'error', 'metrics', 'info', 'warn']

export default class SenseLogs {
    #defaultFilter
    #destinations
    #flag
    #filter
    #name
    #options
    #override
    #redact
    #sample
    #timestamp
    #top

    constructor(options = {destination: 'stdout'}, context = {}) {
        if (!options.child) {
            this.#options = Object.assign({}, options)
            this.#name = options.name || 'app'
            this.#redact = options.redact
            this.#timestamp = options.timestamp || false
            this.#top = this
            this.#filter = {}
            this.#defaultFilter = null
            this.#override = {}
            this.#sample = {}
            this.#destinations = []

            if (options.flag) {
                if (typeof options.flag == 'string') {
                    this.#flag = {error: options.flag, fatal: options.flag}
                } else {
                    this.#flag = options.flag
                }
            } else {
                this.#flag = {error: 'FLAG_ERROR', fatal: 'FLAG_ERROR'}
            }

            let filter = options.filter || DefaultFilter

            /* istanbul ignore next */
            if (typeof process != 'undefined' && process.env) {
                if (process.env.LOG_FILTER != null) {
                    filter = process.env.LOG_FILTER
                }
                if (process.env.LOG_SAMPLE != null) {
                    let [percentage, filter] = process.env.LOG_SAMPLE.split(':')
                    this.setSample(filter, parseInt(percentage))
                }
                if (process.env.LOG_OVERRIDE != null) {
                    let [expire, filter] = process.env.LOG_OVERRIDE.split(':')
                    this.setOverride(filter, expire)
                }
            }
            this.setFilter(filter)
            this.#defaultFilter = Object.keys(this.#filter)

            let format = options.format || 'json'

            if (options.destination === 'console') {
                this.addDestination(new ConsoleDest(), format)
            } else if (options.destination === 'capture') {
                this.addDestination(new CaptureDest(), format)
            } else if (options.destination && typeof options.destination.write == 'function') {
                this.addDestination(options.destination, format)
            } else {
                this.addDestination(new StdoutDest(options), format)
            }
            this.addUncaughtExceptions()
        }
        this.context = Object.assign({}, context)
    }

    /*
        Add a filter to enable specified channels.
    */
    addFilter(filter) {
        if (!filter) {
            return this
        }
        if (!Array.isArray(filter)) {
            if (filter === 'default') {
                filter = DefaultFilter
            } else {
                filter = filter.split(',').map((f) => f.trim())
            }
        }
        for (let chan of filter) {
            if (chan) {
                this.#top.#filter[chan] = true
            }
        }
        return this
    }

    addTraceIds(event, context) {
        let params = {}

        //  API Gateway
        let rcontext = event.requestContext || {}
        let headers = event.headers || {}
        let requestId = rcontext.requestId

        //  Event Bridge
        let detail = event.detail || {}
        let id = detail['x-correlation-id'] || headers['x-correlation-id'] || requestId || headers['X-Amzn-Trace-Id']

        if (id) {
            params['x-correlation-id'] = id
        }
        if (context) {
            params['x-correlation-lambda'] = context.awsRequestId
        }
        if (event.headers) {
            params['x-correlation-trace'] = headers['X-Amzn-Trace-Id']
        }
        if (event.requestContext) {
            params['x-correlation-extended'] = rcontext.extendedRequestId
        }
        if (requestId) {
            params['x-correlation-api'] = requestId
        }
        if (event.detail && event.id) {
            params['x-correlation-eventbridge'] = event.id
        }
        this.addContext(params)
        return this
    }

    setFilter(filter) {
        this.#top.#filter = {}
        if (filter) {
            return this.addFilter(filter)
        }
        return this
    }

    getFilter() {
        return Object.keys(this.#top.#filter)
    }

    getOverride() {
        return this.#top.#override
    }

    getSample() {
        return this.#top.#sample
    }

    /*
        Define a limited duration override filter. If filter is null, clear overrides.
    */
    setOverride(filter, expire) {
        let top = this.#top
        if (!filter) {
            top.#override = {}
            return this
        }
        if (!expire) {
            expire = Date.now()
        }
        if (!Array.isArray(filter)) {
            filter = filter.split(',').map((f) => f.trim())
        }
        for (let chan of filter) {
            if (chan) {
                top.#override[chan] = expire
            }
        }
        return this
    }

    /*
        Define a sampling filter to apply to a percentage of requests. If sample is null, clear samples.
    */
    setSample(filter, rate) {
        if (!filter) {
            this.#top.#sample = {}
            return this
        }
        if (rate == null) {
            rate = 0
        }
        if (rate > 100) {
            rate = 100
        }
        if (!Array.isArray(filter)) {
            filter = filter.split(',').map((f) => f.trim())
        }
        if (rate > 0) {
            for (let chan of filter) {
                if (chan) {
                    this.#top.#sample[chan] = {count: 0, total: 100 / rate}
                }
            }
        } else {
            for (let chan of filter) {
                if (chan) {
                    this.#top.#sample[chan] = null
                }
            }
        }
        return this
    }

    /*
        Create a child logger. This inherits the context and channels.
    */
    child(context) {
        context = context ? Object.assign({}, this.context, context) : this.context
        let log = new SenseLogs({child: true}, context)
        log.#top = this.#top
        return log
    }

    /*
        Add a new logger destination. Multiple destinations are supported.
    */
    addDestination(dest, format = 'json') {
        this.#top.#destinations.push({dest, format})
        return this
    }

    setDestination(dest, format = 'json') {
        this.#top.#destinations = []
        this.#top.#destinations.push({dest, format})
        return this
    }

    /*
        Add (blend) a contexts into the context for this logger
    */
    addContext(contexts) {
        if (!Array.isArray(contexts)) {
            contexts = [contexts]
        }
        for (let context of contexts) {
            this.context = Object.assign(this.context, context)
        }
        return this
    }

    /*
        Clear this loggers context
    */
    clearContext() {
        this.context = {}
        return this
    }

    /*
        Determine if a channel should emit a log message
    */
    enabled(chan, inc = 0) {
        let top = this.#top
        if (top.#filter[chan] == null) {
            if (top.#override[chan] && top.#override[chan] < Date.now()) {
                top.#override[chan] = null
            }
            if (top.#override[chan] == null) {
                let sample = top.#sample[chan]
                if (sample == null) {
                    return false
                }
                sample.count += inc
                if (sample.count < sample.total) {
                    return false
                }
                sample.count = 0
            }
        }
        return true
    }

    process(chan, message, context = {}) {
        let top = this.#top
        context = this.prepare(chan, message, context)
        if (context == null) {
            return
        }
        if (top.#redact) {
            context = top.#redact(context)
        }
        for (let {dest, format} of top.#destinations) {
            if (context) {
                let message = this.format(context, format)
                dest.write(top, context, message)
            }
        }
    }

    /*
        Process a log message and optionally emit
    */
    prepare(chan, message, context = {}) {
        let top = this.#top
        chan = context['@chan'] || chan
        if (!this.enabled(chan, 1)) {
            return null
        }
        //  Clone so we don't alter callers context object
        let ctx = Object.assign({}, context)

        /*
            Handle exceptions where context, message or context.err is an Error
        */
        let exception
        if (context instanceof Error) {
            //  Use context as exception and cleanup context
            exception = {code: context.code, message: context.message, stack: context.stack}
            delete ctx.code
            delete ctx.message
            delete ctx.stack
        } else if (message instanceof Error) {
            //  Use message as exception
            exception = message
            message = exception.message
        } else if (context.err instanceof Error) {
            //  Extract error and cleanup context
            exception = context.err
            if (Object.keys(context).length == 1) {
                //  {err} is only context, so hoist
                ctx = context.err
                delete ctx.code
                delete ctx.message
                delete ctx.stack
            } else {
                delete ctx.err.code
                delete ctx.err.message
                delete ctx.err.stack
            }
        }
        if (exception) {
            //  Error objects are not enumerable by JSON. Convert here and convert stack backtraces to arrays for formatting.
            let err = (ctx['@exception'] = JSON.parse(
                JSON.stringify(exception, Object.getOwnPropertyNames(exception)),
                null,
                4
            ))
            if (err.stack) {
                err.stack = exception.stack
                    .split('\n')
                    .slice(1)
                    .map((r) => r.trim())
            }
        }
        /*
            Grab a stack snapshot if required
        */
        if (ctx['@stack'] === true) {
            try {
                ctx['@stack'] = new Error('stack').stack
                    .split('\n')
                    .slice(1)
                    .map((r) => r.trim())
            } catch (err) {}
        }
        /*
            Save a message already in the context
        */
        if (ctx.message) {
            ctx['@message'] = ctx.message
        }
        ctx.message = typeof message == 'string' ? message : JSON.stringify(message)

        ctx['@chan'] = chan
        ctx['@module'] = ctx['@module'] || top.#name

        if (this.#top.#timestamp) {
            ctx.timestamp = new Date()
        }
        /*
            Flag the message if the flag property is present for this channel
        */
        let flag = top.#flag
        if (flag[chan]) {
            ctx[flag[chan]] = true
        }
        /*
            Blend the log context with this call's context. This call takes precedence.
        */
        return Object.assign({}, this.context, ctx)
    }

    format(context, format) {
        let chan = context['@chan']
        let message
        if (format === 'json') {
            message = this.jsonFormat(context)
        } else if (format === 'human') {
            message = this.humanFormat(context)
        } else if (format === 'tsv') {
            message = this.tsvFormat(context)
        } else if (format === 'keyvalue') {
            message = this.keyValueFormat(context)
        } else if (typeof format === 'function') {
            message = format(context)
        } else {
            message = this.jsonFormat(context)
        }
        return message
    }

    jsonFormat(context) {
        return JSON.stringify(context)
    }

    tsvFormat(context) {
        let message = [new Date().toISOString()]
        for (let value of Object.values(context)) {
            message.push(value)
        }
        message = message.join('\t')
        return message
    }

    keyValueFormat(context) {
        let message = [`"date"="${new Date().toISOString()}"`]
        for (let [key, value] of Object.entries(context)) {
            message.push(`"${key}"="${value}"`)
        }
        message = message.join(',')
        return message
    }

    humanFormat(context) {
        let time = this.getTime()
        let exception = context['@exception']
        let prefix = context['@chan'].toUpperCase()
        let message

        if (exception) {
            message =
                `${time}: ${prefix}: ${context.message}` + '\n' + exception + '\n' + JSON.stringify(context, null, 4)
        } else {
            message = `${time}: ${prefix}: ${context.message}`
            if (Object.keys(context).length > 3) {
                //  More than: message, @module and @chan
                message += ' ' + JSON.stringify(context, null, 4)
            }
        }
        return message
    }

    assert(truthy, message = '', context = {}) {
        if (!(Boolean(truthy) && truthy !== 'false')) {
            message = 'Assert failed' + (message ? `: ${message}` : '')
            this.process('assert', message, context)
        }
    }

    data(message, context) {
        this.process('data', message, context)
    }
    debug(message, context) {
        this.process('debug', message, context)
    }
    error(message, context) {
        this.process('error', message, context)
    }
    fatal(message, context) {
        this.process('fatal', message, context)
    }
    info(message, context) {
        this.process('info', message, context)
    }
    silent(message, context) {
        this.process('silent', message, context)
    }
    trace(message, context) {
        this.process('trace', message, context)
    }
    warn(message, context) {
        this.process('warn', message, context)
    }

    //  Flush context and return (capture) the contexts
    flush(what) {
        let buffer
        for (let {dest} of this.#top.#destinations) {
            if (dest.flush) {
                buffer = dest.flush(this.#top, what)
            }
        }
        return buffer
    }

    /*
        Convenience API to emit a log message for a given channel.
    */
    emit(chan, message, context) {
        this.process(chan, message, context)
    }

    /*
        Emit a CloudWatch metric using the CloudWatch EMF format.

        metrics(chan, message, 'MyCompany/MyApp', {UserSessions: 1}, dimensions, {UserSessions: 'Count'}, properties)
        Dimensions are an array of dimension names. The values must be in `values`
        Properties are additional properties that are not metrics, but are emitted. Useful for SenseDeep & insights.
    */
    metrics(chan, message, namespace, values, dimensions = [], units = null, properties = {}) {
        let top = this.#top
        if (!top.#filter.metrics) {
            return
        }
        /* istanbul ignore next */
        if (!namespace || !values) {
            throw new Error('Missing namespace or values')
        }
        if (!this.enabled(chan, 1)) {
            return
        }
        //  Get list of value keys that are not in dimensions. These are the metrics.
        let keys = Object.keys(values).filter((v) => dimensions.indexOf(v) < 0)
        let metrics = keys.map((name) => {
            let def = {Name: name}
            if (units) {
                let unit = units[name] || units.default
                if (unit) {
                    def.Unit = unit
                }
            }
            return def
        })
        let context = {
            '@chan': chan,
            '@namespace': namespace,
            '@metrics': keys,
            message:
                message +
                ' ' +
                JSON.stringify(
                    Object.assign(
                        {
                            _aws: {
                                Timestamp: Date.now(),
                                CloudWatchMetrics: [
                                    {
                                        Dimensions: [dimensions],
                                        Namespace: namespace,
                                        Metrics: metrics,
                                    },
                                ],
                            },
                        },
                        properties,
                        values
                    )
                ),
        }
        //  Write directly bypassing process and format()
        for (let {dest} of this.#top.#destinations) {
            dest.write(this.#top, context, context.message)
        }
    }

    addUncaughtExceptions() {
        let self = this
        if (typeof window != 'undefined') {
            /* istanbul ignore next */
            global.onerror = function (message, module, line, column, err) {
                self.error(message, {err})
            }
            /* istanbul ignore next */
            global.onunhandledrejection = (rejection) => {
                let message = `Unhandled promise rejection : ${rejection.message}`
                if (rejection && rejection.reason && rejection.reason.stack) {
                    message += `\r${rejection.reason.stack}`
                }
                self.error(message)
            }
        }
    }

    addNodeExceptions() {
        let self = this
        /* istanbul ignore next */
        if (typeof process != 'undefined') {
            process.on('uncaughtException', function (err) {
                self.error('Uncaught exception', {err})
            })
        }
    }

    //  Abbreviated time for human format
    getTime() {
        let now = new Date()
        return `${this.zpad(now.getHours(), 2)}:${this.zpad(now.getMinutes(), 2)}:${this.zpad(now.getSeconds(), 2)}`
    }

    zpad(n, size) {
        let s = n + ''
        while (s.length < size) s = '0' + s
        return s
    }
}

//  Just for testing so we can capture the output
class CaptureDest {
    messages = []
    contexts = []
    flush(log, what = 'context') {
        let result = what === 'message' ? this.messages : this.contexts
        this.messages = []
        this.contexts = []
        return result
    }

    write(log, context, message) {
        this.messages.push(message)
        this.contexts.push(context)
    }
}

//  AWS Lambda Node will prefix messages with an ISO timestamp and request ID (redundantly)
class ConsoleDest {
    write(log, context, message) {
        if (context['@chan'] === 'error') {
            console.error(message)
        } else {
            console.log(message)
        }
    }
}

class StdoutDest {
    constructor(options) {
        if (typeof process != 'undefined' && process.stdout) {
            this.stdout = process.stdout
        } else {
            this.stdout = {write: this.output}
        }
    }

    write(log, context, message) {
        this.stdout.write(message + '\n')
    }

    //  Fallback for browsers lacking process.stdout
    /* istanbul ignore next */
    output(msg) {
        console.log(msg)
    }
}
