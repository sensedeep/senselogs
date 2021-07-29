/*
    Senselogs - Simple, fast, dynamic logging for serverless
 */

const DefaultFilter = ['fatal', 'error', 'metrics', 'info', 'warn']

export default class SenseLogs {
    #defaultFilter
    #destinations
    #filter
    #options
    #override
    #name
    #redact
    #sample
    #timestamp
    #top

    /*
        Options:
            destination
            filter
            name
            redact
            timestamp
    */
    constructor(options = {destination: 'json'}, context = {}) {
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

            if (options.destination == 'console') {
                this.addDestination(new ConsoleDest())

            } else if (options.destination == 'capture') {
                this.addDestination(new CaptureDest())

            } else if (options.destination && typeof options.destination.write == 'function') {
                this.addDestination(options.destination)

            } else {
                //  Default to json
                this.addDestination(new JsonDest())
            }
            this.addUncaughtExceptions()
        }
        this.context = context
    }

    /*
        Add a filter to enable specified channels.
    */
    addFilter(filter) {
        if (!filter) {
            return this
        }
        if (!Array.isArray(filter)) {
            if (filter == 'default') {
                filter = this.#defaultFilter || DefaultFilter
            } else {
                filter = filter.split(',').map(f => f.trim())
            }
        }
        for (let chan of filter) {
            if (chan) {
                this.#top.#filter[chan] = true
            }
        }
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
        return Object.keys(this.#filter)
    }

    getOverride() {
        return this.#override
    }

    getSample() {
        return this.#sample
    }

    /*
        Define a limited duration override filter. If filter is null, clear overrides.
    */
    setOverride(filter, expire) {
        if (!filter) {
            this.#override = {}
            return this
        }
        if (!expire) {
            expire = Date.now()
        }
        if (!Array.isArray(filter)) {
            filter = filter.split(',').map(f => f.trim())
        }
        for (let chan of filter) {
            if (chan) {
                this.#top.#override[chan] = expire
            }
        }
        return this
    }

    /*
        Define a sampling filter to apply to a percentage of requests. If sample is null, clear samples.
    */
    setSample(filter, rate) {
        if (!filter) {
            this.#sample = {}
            return this
        }
        if (rate == null) {
            rate = 0
        }
        if (rate > 100) {
            rate = 100
        }
        if (!Array.isArray(filter)) {
            filter = filter.split(',').map(f => f.trim())
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
    addDestination(dest) {
        this.#top.#destinations.push(dest)
        return this
    }

    setDestination(dest) {
        this.#top.#destinations = []
        this.#top.#destinations.push(dest)
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
    shouldLog(chan) {
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
                if (++sample.count < sample.total) {
                    return false
                }
                sample.count = 0
            }
        }
        return true
    }

    /*
        Process a log message and optionally emit
    */
    process(chan, message, context) {
        if (!this.shouldLog(chan)) {
            return
        }
        let exception

        if (context instanceof Error) {
            exception = context
            context = {}
        } else {
            context = Object.assign({}, context)
        }
        context['@chan'] = chan
        context['@module'] = context['@module'] || this.#top.#name

        if (this.#timestamp) {
            context.timestamp = new Date()
        }
        if (context['@stack'] === true) {
            try {
                context['@stack'] = (new Error('stack')).stack.split('\n')[3].trim().replace(/^.*webpack:\/|:[0-9]*\)$/g, '')
            } catch (err) {}
        }
        if (context.message) {
            context['@message'] = context.message
        }
        if (message instanceof Error) {
            exception = message
            message = exception.message

        } else if (context.err instanceof Error) {
            exception = context.err
            delete context.err

        } else if (typeof message != 'string') {
            message = JSON.stringify(message)
        }

        if (exception) {
            context['@exception'] = exception
            message = message || exception.message
        }
        context.message = message

        context = Object.assign({}, this.context, context)

        if (this.#redact) {
            context = this.#redact(context)
            if (!context) return
        }
        this.write(context)
    }

    data(message, context)  { this.process('data', message, context) }
    debug(message, context) { this.process('debug', message, context) }
    error(message, context) { this.process('error', message, context) }
    fatal(message, context) { this.process('fatal', message, context) }
    info(message, context)  { this.process('info', message, context) }
    trace(message, context) { this.process('trace', message, context) }
    warn(message, context)  { this.process('warn', message, context) }

    /*
        Write a log message to the configured destinations
    */
    write(context) {
        for (let dest of this.#top.#destinations) {
            dest.write(this.#top, context)
        }
    }

    flush(context) {
        let buffer
        for (let dest of this.#top.#destinations) {
            buffer = dest.flush(this.#top, context)
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
        Emit a CloudWatch metic using the CloudWatch EMF format.

        metrics('MyCompany/MyApp', {UserSessions: 1}, dimensions)
    */
    metrics(namespace, values, dimensions = [[]]) {
        if (!this.#top.#filter.metrics) {
            return
        }
        /* istanbul ignore next */
        if (!namespace || !values) {
            throw new Error('Missing namespace or values')
        }
        let keys = Object.keys(values).filter(v => dimensions[0].indexOf(v) < 0)
        let metrics = keys.map(v => {return {Name: v}})
        let context = {
            '@chan': 'metrics',
            '@namespace': namespace,
            '@metrics': keys,
            message: `Metrics for ${namespace} ` + JSON.stringify(Object.assign({
                _aws: {
                    Timestamp: Date.now(),
                    CloudWatchMetrics: [{
                        Dimensions: dimensions,
                        Namespace: namespace,
                        Metrics: metrics,
                    }]
                },
            }, values))
        }
        for (let dest of this.#top.#destinations) {
            dest.write(this.#top, context)
        }
    }

    addUncaughtExceptions() {
        let self = this
        if (typeof window != 'undefined') {
            /* istanbul ignore next */
            global.onerror = function(message, module, line, column, err) {
                self.error(message, err)
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
            process.on("uncaughtException", function(err) {
                self.error('Uncaught exception', err)
            })
        }
    }
}

/*
    Log output in pure JSON
*/
class JsonDest {
    write(log, context) {
        let chan = context['@chan']
        if (chan == 'metrics') {
            console.log(context.message)
        } else {
            console.log(JSON.stringify(context) + '\n')
        }
    }
}

/*
    Capture Destination
*/
class CaptureDest {
    buffer = []
    flush() {
        let buffer = this.buffer
        this.buffer = []
        return buffer
    }

    write(log, context) {
        let chan = context['@chan']
        if (chan == 'metrics') {
            this.buffer.push(context.message)
        } else {
            this.buffer.push(context)
        }
    }
}

/*
    Simple destination to the console. Uses abbreviated time format.
*/
class ConsoleDest {
    write(log, context) {
        let message = context.message
        let module = context['@module']
        let time = this.getTime()
        let chan = context['@chan']
        let exception = context['@exception']
        if (exception) {
            console.error(`${time}: ${module}: ${chan}: ${message}: ${exception.message}`)
            console.error(exception.stack)
            console.error(JSON.stringify(context, null, 4) + '\n')

        } else if (chan == 'error') {
            console.error(`${time}: ${module}: ${chan}: ${message}`)
            if (Object.keys(context).length > 3) {
                console.error(JSON.stringify(context, null, 4) + '\n')
            }

        } else if (chan == 'metrics') {
            console.log(context.message + '\n')

        } else if (chan == 'trace') {
            console.log(`${time}: ${module}: ${chan}: ${message}`)
            console.log(JSON.stringify(context, null, 4) + '\n')

        } else {
            console.log(`${time}: ${module}: ${chan}: ${message}`)
            if (Object.keys(context).length > 3) {
                //  More than: message, @module and @chan
                console.log(JSON.stringify(context, null, 4) + '\n')
            }
        }
    }

    //  Abbreviated timea for console destination
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
