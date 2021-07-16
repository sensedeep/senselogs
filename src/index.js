/*
    senselogs - Simple, fast, dynamic logging for serverless

    Usage:
        import Log from 'senselogs'

        let log = new Log({
            name: 'app/module name',
            levels: [ 'error', 'info', ...]            //  Default: data, debug, error, fatal, info, trace, warn
            destination: 'json|console',
            redact: fn
        }, {context})

        let child = log.child(context)

        log.addLevels(level, ...)
        log.addDestination(fn)
        log.setFilter(level, ...)

        log.STREAM(message, context)
        log.info('messsage', {_stack_: true})

        log.metrics(namespace, values, dimensions)

        environment
            LOG_FILTER=level,level,...
            LOG_OVERRIDE=epoch:level,level,...
            LOG_SAMPLE=percentage:level,level,...

    Internal context properties: @exception, @module, @level, @stack, (@message if context.message provided)
 */

const DefaultLevels = ['data', 'debug', 'error', 'fatal', 'info', 'trace', 'warn']
const DefaultFilter = ['fatal', 'error', 'metrics', 'info', 'warn']

export default class SenseLogs {
    #destinations
    #filter
    #options
    #override
    #name
    #redact
    #sample
    #levels
    #timestamp
    #top

    /*
        Options:
            destination
            filter
            levels
            name
            redact
            timestamp
    */
    constructor(options = {destination: 'console'}, context = {}) {
        if (!options.child) {
            this.#options = options
            this.#name = options.name || 'app'
            this.#redact = options.redact
            this.#timestamp = options.timestamp || false
            this.#top = this
            this.#filter = {}
            this.#override = {}
            this.#sample = {}
            this.#destinations = []
            this.#levels = {}

            this.addLevels(options.levels || DefaultLevels)

            let filter = options.filter || DefaultFilter
            if (typeof process != 'undefined' && process.env) {
                if (process.env.LOG_FILTER != null) {
                    filter = (process.env.LOG_FILTER == 'default') ? DefaultFilter : process.env.LOG_FILTER
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

            if (options.destination == 'json') {
                this.addDestination(new JsonDest())
            } else if (options.destination == 'console') {
                this.addDestination(new ConsoleDest())
            } else if (options.destination == 'capture') {
                this.addDestination(new CaptureDest())
            } else if (options.destination) {
                this.addDestination(options.destination)
            }
            this.addUncaughtExceptions()
        }
        this.context = context
    }

    /*
        Add a list of levels to the existing levels. Each level will create a method of the same name on this.
     */
    addLevels(levels) {
        if (!Array.isArray(levels)) {
            levels = [levels]
        }
        for (let level of levels) {
            if (this[level] != null) {
                throw new Error(`Level already defined on log`)
            }
            this.#makeMethod(level)
        }
        return this
    }

    /*
        Define a level method on this. The set of levels is unique for each child logger.
     */
    #makeMethod(level) {
        this[level] = (message, context) => this.process(level, message, context)
        this.#levels[level] = true
    }

    /*
        Update the filter that specifies which levels should emit messages.
        The filter is common to all child loggers.
    */
    addFilter(filter) {
        if (!Array.isArray(filter)) {
            filter = filter.split(',').map(f => f.trim())
        }
        for (let level of filter) {
            this.#top.#filter[level] = true
        }
        return this
    }

    /*
        Update the filter that specifies which levels should emit messages.
        The filter is common to all child loggers.
    */
    setFilter(filter) {
        this.#top.#filter = {}
        return this.addFilter(filter)
    }

    /*
        Define a limited duration override filter
    */
    setOverride(filterj, expire) {
        for (let level of filterj.split(',').map(o => o.trim())) {
            this.#top.#override[level] = expire
        }
        return this
    }

    /*
        Define a sampling filter to apply to a percentage of requests
    */
    setSample(filter, rate) {
        if (rate > 0) {
            for (let level of filter.split(',').map(s => s.trim())) {
                this.#top.#sample[level] = {count: 0, total: 100 / rate}
            }
        } else {
            for (let level of filter.split(',').map(s => s.trim())) {
                this.#top.#sample[level] = null
            }
        }
        return this
    }

    /*
        Create a child logger. This inherits the context and levels.
    */
    child(context) {
        context = context ? Object.assign({}, this.context, context) : this.context
        let log = new SenseLogs({child: true}, context)
        log.#top = this.#top
        log.#levels = Object.assign({}, this.#levels)
        for (let level of Object.keys(this.#levels)) {
            log[level] = this[level]
        }
        return log
    }

    /*
        Add a new logger destination. Multiple destinations are supported.
    */
    addDestination(dest) {
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
        Determine if a level should emit a log message
    */
    shouldLog(level) {
        let top = this.#top
        if (top.#filter[level] == null) {
            if (top.#override[level] && top.#override[level] < Date.now()) {
                top.#override[level] = null
            }
            if (top.#override[level] == null) {
                let sample = top.#sample[level]
                if (sample == null) {
                    return false
                }
                if (sample.count++ < sample.total) {
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
    process(level, message, context) {
        if (!this.shouldLog(level)) {
            return
        }
        let exception

        if (context instanceof Error) {
            exception = context
            context = {}
        } else {
            context = Object.assign({}, context)
        }
        context['@level'] = level
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
        Convenience API to emit a log message for a given level.
    */
    emit(level, message, context) {
        this.process(level, message, context)
    }

    /*
        Emit a CloudWatch metic using the CloudWatch EMF format.

        metrics('SenseDeep/App', {UserSessions: 1}, dimensions)
    */
    metrics(namespace, values, dimensions = [[]]) {
        if (!this.#top.#filter.metrics) {
            return
        }
        if (!namespace || !values) {
            throw new Error('Missing namespace or values')
        }
        let keys = Object.keys(values).filter(v => dimensions[0].indexOf(v) < 0)
        let metrics = keys.map(v => {return {Name: v}})
        let context = {
            '@level': 'metrics',
            '@namespace': namespace,
            '@metrics': keys,
            message: JSON.stringify(Object.assign({
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
            global.onerror = function(message, module, line, column, err) {
                self.error(message, err)
            }
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
        let level = context['@level']
        try {
            if (level == 'metrics') {
                console.log(context.message)
            } else {
                console.log(JSON.stringify(context) + '\n')
            }

        } catch (err) {
            console.log(context.message + '\n')
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
        let level = context['@level']
        if (level == 'metrics') {
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
        try {
            let time = this.getTime()
            let level = context['@level']
            let exception = context['@exception']
            if (exception) {
                console.error(`${time}: ${module}: ${level}: ${message}: ${exception.message}`)
                console.error(exception.stack)
                console.error(JSON.stringify(context, null, 4) + '\n')

            } else if (level == 'error') {
                console.error(`${time}: ${module}: ${level}: ${message}`)
                console.error(JSON.stringify(context, null, 4) + '\n')

            } else if (level == 'metrics') {
                console.log(context.message + '\n')

            } else if (level == 'trace') {
                console.log(`${time}: ${module}: ${level}: ${message}`)
                console.log(JSON.stringify(context, null, 4) + '\n')

            } else {
                console.log(`${time}: ${module}: ${level}: ${message}`)
                if (Object.keys(context).length > 3) {
                    //  More than: message, @module and @level
                    console.log(JSON.stringify(context, null, 4) + '\n')
                }
            }
        } catch (err) {
            console.log(`Exception in emitting log message: ${message}`)
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
