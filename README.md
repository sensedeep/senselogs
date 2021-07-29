![SenseLogs](https://www.sensedeep.com/images/senselogs.png)

[![Build Status](https://img.shields.io/github/workflow/status/sensedeep/senselogs/build)](https://img.shields.io/github/workflow/status/sensedeep/senselogs/build)
[![npm](https://img.shields.io/npm/v/senselogs.svg)](https://www.npmjs.com/package/senselogs)
[![npm](https://img.shields.io/npm/l/senselogs.svg)](https://www.npmjs.com/package/senselogs)
[![Coverage Status](https://coveralls.io/repos/github/sensedeep/senselogs/badge.svg?branch=main)](https://coveralls.io/github/sensedeep/senselogs?branch=main)

SenseLogs is a simple, flexible, dynamic, blazing fast log library designed exclusively for serverless apps using NodeJS.

While there are many other good logging libraries that claim to be fast, they were not designed `for` serverless and so are bigger and slower than necessary.

Furthermore, serverless apps have special requirments like minimizing cold-start time, dynamic log filtering control without redploying and being able to capture detailed context and request information without modifying your functions.

SenseLogs is designed to do this, simply and elegantly.

## SenseLogs Features

* Extremely fast initialization time to shorten cold-starts.
* Clean, readable small code base (<500 lines).
* Emits logs in JSON with rich context.
* Dynamic log control to change log filters without redeploying.
* Log sampling to emit increased logs for a percentage of requests.
* Stack capture for uncaught exceptions.
* Flexible log channels and filters.
* Inheriting child log instances for per-module logging.
* For local debugging, emits in human readable formats.
* Easily emit CloudWatch custom metrics using EMF.
* Integrates with SenseDeep developer studio.
* No dependencies.
* Full TypeScript support.

## Quick Tour

Import the SenseLogs library. If you are not using ES modules or TypeScript, use `require` to import the libraries.

```javascript
import SenseLogs from 'senselogs'
```

Create and configure a logger.

```javascript
const log = new SenseLogs({name: 'MyApp'})
```

Then log with a message:

```javascript
log.info('Simple messsage')
log.error(`Request error for user: ${user.email}`)
```

You can also supply addition message context:

```javascript
log.error('Another log error message with context', {
    requestId: 1234,
    userId: '58b23f29-3f84-43ff-a767-18d83500dbd3'
})
```

This will emit

```javascript
{
    "message": "Another log error message with context",
    "requestId": 1234
    "userId": "58b23f29-3f84-43ff-a767-18d83500dbd3"
}
```

SenseLogs organizes log messages via channels which are simple names given to classify log message types.
SenseLogs provides methods for standard channels like: 'debug', 'error', 'warn' and 'info'. You can easily extend upon the basic set of channels with your own. For example:

```javascript
log.error('Bad things happen sometimes')
log.error(new Error('Invalid request state'), {request})

log.debug('The queue was empty')
log.trace('Database request', {request})

log.emit('custom-channel', 'My custom channel')
```

### Output Format

By default SenseLogs will emit log messages in JSON format to the console. Using JSON format is highly recommended. You should add rich context to your logging messages and use a log management solution like [SenseDeep](https://www.sensedeep.com) that is designed to handle JSON log messages with ease.

You can also configure the logger to emit human readable output by setting the destination to 'console'

```javascript
const log = new SenseLogs({destination: 'console'})
```

You can supply additional destinations at any time via the `addDestination`. This is useful to ship your logs to other destinations or to transform and format the output as you please.

```javascript
log.addDestination({write: (logger, context) =>
    console.log(JSON.stringify(context))
}})
```

Use `setDestination` to replace all destinations.

By default, SenseLogs messages do not include a timestamp because Lambda and other services typically add their own timestamps. If you need a timestamp, set the `params.timestamp` to true in the SenseLogs constructor.


### Log Channels

SenseDeep defines the following default log channels: `data`, `debug`, `error`, `fatal`, `info`, `metrics`, `trace` and `warn`. These have corresponding log methods of the same name.

Log messages will be emitted when you call a log channel method AND that channel is enabled in the filter set. See filters below.

You can also create custom channels for modules or services in your application, or you can use channels for horizontal traits like `testing`.

For example:

```javascript
log.addFilter('auth')

//  Use the 'auth' channel
log.emit('auth', 'User Login', {user})
```

### Filtering

Log messages are emitted if the log channel is enabled in the filter set.

The default filter set will emit messages for the `fatal`, `error`, `metrics`, `info` and `warn`, channels. The default `data`, `debug` and `trace` channels will be hidden.

You can change the channel filter via `addFilter` or `setFilter` at any time.

```javascript
log.addFilter(['data', 'debug'])
```

This will enable messages for the `data` and `debug` channels.


### Contexts

For true `observability`, it is recommended that you log full information regarding request state in anticipation of future monitoring needs.

Additional context information can be supplied when calling a log channel method or the `emit` methods. The context is supplied as the second parameter.

```javascript
log.info('Basic message', {
    //  Extra context
    event: lambda.event,
    context: lambda.context,
    requestId: apiGateway.requestId,
})
```

This per-API context is merged with the global logger context. When you create the logger, you can specify global context.

```javascript
const log = new SenseLogs({params}, {
    //  Global context properties
})
```

Per-API context takes precedence over the global context if both contexts define the same value.

You can extend or clear the global context at anytime via `addContext` and `clearContext`:

```javascript
log.addContext({params})
log.clearContext()
```

SenseLogs accumlates all the context information into a single context that is passed to the log destinations for writing.


### Child Instances

If you have modules or subsystems, it is often useful for them to derive their own child log instances which inherit context and channels from their parent instance. Then the child can modify the context and channels to suit.

```javascript
const child = log.child({
    module: 'authentication',
})

child.info('Start request')
```

This will log the given message with the child context and the context of all its parents.

Child instances can be created to any desired depth. i.e. a child can be created from a child instance.


### Dynamic Logging and Environment Variables

SenseLogs filtering can be dynamically controlled by calling filter APIS or by setting environment varibles for Lambda functions.

You can modify the default filter, override filter and sampling filters.

The APIs are:

* setFilter
* setOverride
* setSample

The environment variables are:

* LOG_FILTER
* LOG_OVERRIDE
* LOG_SAMPLE

If you change these environment variables, the next time your Lambda functions is invoked, it will be loaded with the new environment variable values. In this manner, you can dynamically and immediately control your logging channels without modifying code or redeploying.

The [SenseDeep serverless studio](https://www.sensedeep.com) provides a convenient interface to manage these filter settings and will update these environment variables on your Lambdas.

#### LOG_FILTER

The LOG_FILTER is read by the SenseLogs constructor to invoke `setFilter` to define the default log filter. Set it to a comma separated list of log channels. For example:

```shell
LOG_FILTER=fatal,error,info
```

#### LOG_OVERRIDE

The LOG_OVERRIDE is read by SenseLogs to invoke `setOverride` to define an override log filter that will apply for a limited duration of time. Set it to a comma separated list of log channels that is prefixed by an expiry time as a Unix epoch (seconds since Jan 1 1970). For example:

```shell
LOG_OVERRIDE=1626409530045:data,trace
```

### LOG_SAMPLE

The LOG_SAMPLE is used to invoke `setSample` to define an additional log filter that will apply for percentage of requests. Set it to a comma separated list of log channels that is prefixed by a percentage. For example:

```shell
LOG_SAMPLE=1%:trace
```

This will cause 1% of log requests to the given log channels to be logged. This is useful to ensure you have a complete trace of some requests at all times without needing to redeploy or reconfigure.

### CloudWatch Metrics and EMF

SenseLogs has integrated support to emit custom metrics to CloudWatch.

AWS CloudWatch understands the Embedded Metric Format (EMF) where you can easily emit metrics to CloudWatch.

CloudWatch receives EMF metrics and dynamically creates and tracks metrics without prior configuration.

EMF is one of the hidden gems in CloudWatch.

```javascript
log.metrics('Acme/Rockets', {Launches: 1})
```

The metrics API take a custom CloudWatch metrics namespace as the first parameter. The second parameter contains the values. The optional third contains additional dimensions.


### Exceptions and Error Handling

You can provide an Error() object to SenseLogs as the message, context or context.err property. For example:

```javascript
//  As a message
log.error(new Error('Boom'))

//  As a context
log.error('An error', new Error('Boom'))

try { thow new Error() }
catch (err) {
    //  As context.err
    log.error('Caught error', {err})
}
```

When SenseLogs receives an exception Error object, it will capture the stack trace and include that in the logged JSON as a '@stack' property.

You can request a stack backtrace be included in any log message by setting the `@stack: true` in the context.

```javascript
log.debug('Should never get here', {'@stack': true})
```

### Redacting Sensitive Information

You can modify log data to remove sensitive information before it is emitted by supplying your own redact function to the SenseLogs constructor.

```
const log = new SenseLogs({redact: (context) => {
    if (context.password) {
        context.password = '[REDACTED]'
    }
}})
```

If you are using the [SenseDeep Serverless Developer Studio](https://www.sensedeep.com), you don't need to worry about redacting sensitive information as your log data never leaves your account.

But for all others, you can connect the redact function to any one of the NPM redaction modules. For example: [fast-redact](https://www.npmjs.com/package/fast-redact).


### SenseLogs Class API

The SenseLogs class provides the public API for SenseLogs and public properties..

### SenseLogs Constructor

```javascript
new SenseLogs(options, context = {})
```

The SenseLogs constructor takes an options parameter and an optional context property.

The `options` parameter is of type `object` with the following properties:

| Property | Type | Description |
| -------- | :--: | ----------- |
| destination | `string\|function` | Set to `json`, `console` or an instance of an object with a `write` function to be invoked as write(logger, context). |
| filter | `string\|array` | Set to a comma separated list or array of log channels that are enabled. |
| name | `string` | Name for your app or service. The context.@module is set to this value by default. |
| redact | `function` | Callback function invoked prior to passing the context data to the logger. Invoked as `callback(context)`|
| timestamp | `boolean` | Set to true to add a context.timestamp to the log context message.|

The `context` property is a map of context information that is included in all log messages.

For example:

```javascript
const log = new SenseLogs({
    destination: 'console',
    filter: 'fatal, error',
    name: 'MyApp',
    redact: (context) => { console.log(JSON.stringify(context)) },
    timestamp: true,
}, {context})
```


### Properties

SenseLogs creates some reserved properties on the log message context. These properties are prefixed with `@` to avoid clashing with your properties.

* @exception &mdash; Set if an `Error` object is passed to SenseLogs.
* @module &mdash; Set to the `name` given to the SenseLogs constructor or the `@module` context property on a child instance.
* @chan &mdash; Set to the log channel for the current log message (info, error, ...).
* @stack &mdash; Set to a captured stack backtrace.
* @message &mdash; If a context.message is supplied in addition to the API message, the context message will be saved as `@message`.


### Methods

#### addContext(contexts: object | array)

Blend the given context properites or array of contexts into the log context.

#### addDestination(dest)

Add the given destination function to the set of destinations. The destination is an object with a write method that will be invoked as:

```javascript
dest(logger: SenseLogs, context: object)
```


#### addFilter(filter: string | array)

Enable the log channels described by the given filter in the current filter set. The current filter specifies the log channels that are enabled to emit log data.

The filter may be a comma separated string or an array of channels. Set `filter` to "default" to revert to the default filter set.


#### child(context: {}): SenseLogs

Create a child log instance derived from the parent log. The child context has its own context inherited from the parent log instance and it has its own set of log channels.

Children and parent instances share a single, common filter of enabled log channels.

```javascript
const child = log.child({brush: 'green'})
child.emit('color', 'Favorite color')
```

#### clearContext()

This will clear the context for the log instance.


#### getFilter()

Return an array of the current filter channels.


#### getOverride()

Return a map containing the current override definition.

#### getSample()

Return a map containing the current sample definition.


#### emit(channel: string, message: string, context: {})

Convenience method that takes the channel as the first argument.


#### metrics(namespace: string, values: [], dimensions = [[]])

Emit metrics in CloudWatch EMF format.

The namespace is your unique custom namespace and usually consists of your name with service name. For example: 'SenseDeep/App'.

The values is an array of metric values to submit. Dimensions are the optional CloudWatch Metrics two-dimensional array of extra dimensions.

#### setFilter(filter: string | array)

Set the filter channels described by the given filter parameter. The current filter set specifies the channels that enabled to emit log data.

The filter may be a comma separated string or an array of channels. If filter is null, this call will remove all filter channels. If filter is set to 'default', the filter channels will be restored to the default defined via the constructor.



#### setOverride(filter: string | array, expire: number)

Set the override filter channels described by the given filter. The override filter will augment the default filter with additional channels until the `expire` time has been reached. When override channels are defined, the enabled channels are those defined by the union of the filter channels and the override channels.

The filter may be a comma separated string or an array of channels. If the filter is null, this call will clear all overrides.

Expire is a Unix epoch date (seconds since Jan 1 1970).


#### setSample(filter: string | array, percentage: number)

Set the sampling filter channels described by the given filter. The filter may be a comma separated string or an array of channels.

The sample filter will augment the filter and override filter for the given percentage of requests. Set percentage to a positive percentage (may be fractional). When sample channels are defined, the enabled channels are those defined by the union of the filter channels, the override channels and the sample channels.

If the filter is null, this call will remove all samples.

#### Level APIs

The standard channels and method signatures are:

```typescript
    data(message: string, context: {}): void;
    debug(message: string, context: {}): void;
    error(message: string, context: {}): void;
    fatal(message: string, context: {}): void;
    info(message: string, context: {}): void;
    trace(message: string, context: {}): void;
    warn(message: string, context: {}): void;
    emit(channel: string, message: string, context: {}): void;
```

### References

- [SenseLogs Tests](https://github.com/sensedeep/senselogs/tree/main/test)
- [SenseDeep Blog](https://www.sensedeep.com/blog/)
- [SenseDeep Web Site](https://www.sensedeep.com/)
- [SenseDeep Developer Studio](https://app.sensedeep.com/)

### Participate

All feedback, discussion, contributions and bug reports are very welcome.

* [discussions](https://github.com/sensedeep/senselogs/discussions)
* [issues](https://github.com/sensedeep/senselogs/issues)

### Contact

You can contact me (Michael O'Brien) on Twitter at: [@mobstream](https://twitter.com/mobstream), or [email](mob-pub-18@sensedeep.com) and ready my [Blog](https://www.sensedeep.com/blog).

### SenseDeep

Please try best way to create serverless apps using the Serverless Developer Studio [SenseDeep](https://www.sensedeep.com/). It is integrated with SenseLogs and will control your filter channels for Lambdas without needing to redeploy.
