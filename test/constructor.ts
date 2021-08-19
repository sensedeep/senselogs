/*
    constructor.ts - Constructor test
 */
import {SenseLogs, print, dump, delay, cap} from './utils/init'

// jest.setTimeout(7200 * 1000)

test('Constructor: destination, name', async() => {
    const log = new SenseLogs({name: 'test', destination: 'capture'})
    log.info('Hello World')

    let result = log.flush()
    expect(result.length).toBe(1)
    expect(result[0]).toMatchObject({
        '@chan': 'info',
        '@module': 'test',
        'message': 'Hello World'
    })
})

test('Constructor: timestamp', async() => {
    const log = new SenseLogs({name: 'test', destination: 'capture', timestamp: true})
    log.info('Hello World')

    let result: any = log.flush()[0]
    expect(result).toMatchObject({
        '@chan': 'info',
        '@module': 'test',
        'message': 'Hello World'
    })
    expect(result.timestamp instanceof Date).toBe(true)
})

test('Constructor: filter', async() => {
    const log = new SenseLogs({
        destination: 'capture',
        filter: 'error',
    })

    log.error('Some error')
    let result: any = log.flush()[0]
    expect(result).toMatchObject({
        '@chan': 'error',
        'message': 'Some error'
    })

    log.info('Hello')
    result = log.flush()
    expect(result.length).toBe(0)
})

test('Constructor json format', async() => {
    const log = new SenseLogs({
        destination: 'capture',
        format: 'json',
    })
    log.error('Some error')
    let result: any = log.flush()[0]
    expect(result).toMatchObject({
        '@chan': 'error',
        'message': 'Some error'
    })
})

test('Constructor tsv format', async() => {
    const log = new SenseLogs({
        destination: 'capture',
        format: 'tsv',
    })
    log.error('Some error')
    let result: any = log.flush()[0]
    expect(result).toMatchObject({
        '@chan': 'error',
        'message': 'Some error'
    })
})

test('Constructor human format', async() => {
    const log = new SenseLogs({
        destination: 'capture',
        format: 'human',
    })
    log.error('Some error')
    let result: any = log.flush()[0]
    expect(result).toMatchObject({
        '@chan': 'error',
        'message': 'Some error'
    })
})

test('Constructor: channels', async() => {
    const log: any = new SenseLogs({
        destination: 'capture',
    })
    log.addFilter('custom')

    log.emit('custom', 'Custom message')
    let result: any = log.flush()[0]
    expect(result).toMatchObject({
        '@chan': 'custom',
        'message': 'Custom message'
    })
})

test('Constructor: redact', async() => {
    const log: any = new SenseLogs({
        destination: 'capture',
        redact: (context: any) => {
            context.message = '[REDACTED]'
            return context
        }
    })
    log.info('Hello World')
    let result: any = log.flush()[0]
    expect(result.message).toBe('[REDACTED]')
})

test('Constructor: other destinations', async() => {

    let log: any = new SenseLogs({destination: 'console'})
    expect(log instanceof SenseLogs).toBe(true)

    cap()
    log.info('For coverage')
    log.error('For coverage')
    cap(false)

    log = new SenseLogs({destination: 'stdout'})
    expect(log instanceof SenseLogs).toBe(true)
})

test('Constructor: env vars', async() => {
    process.env.LOG_FILTER="error,info"
    let log: any = new SenseLogs({destination: 'capture'})
    expect(log instanceof SenseLogs).toBe(true)

    process.env.LOG_OVERRIDE=`${Date.now()}:error,info,data,trace`
    log = new SenseLogs({destination: 'capture'})
    expect(log instanceof SenseLogs).toBe(true)

    process.env.LOG_SAMPLE="1%:error,info,data,trace"
    log = new SenseLogs({destination: 'capture'})
    expect(log instanceof SenseLogs).toBe(true)

    process.env.LOG_SAMPLE="0%:error,info,data,trace"
    log = new SenseLogs({destination: 'capture'})
    expect(log instanceof SenseLogs).toBe(true)

    process.env.LOG_FILTER="default"
    log = new SenseLogs({destination: 'capture'})
    expect(log instanceof SenseLogs).toBe(true)
})

test('Flag string', async() => {
    let log: any = new SenseLogs({destination: 'capture', flag: 'ERROR'})

    //  Should get ERROR property
    log.error('Boom')
    let result: any = log.flush()[0]
    expect(result.ERROR).toBe(true)

    //  Should not get ERROR property
    log.info('Boom')
    result = log.flush()[0]
    expect(result.ERROR).toBeUndefined()
})

test('Flag map', async() => {
    let log: any = new SenseLogs({destination: 'capture', flag: {error: 'ERROR', warn: 'WARN'}})

    //  Should get ERROR property
    log.error('Boom')
    let result: any = log.flush()[0]
    expect(result.ERROR).toBe(true)

    //  Should get WARN property
    log.warn('Boom')
    result = log.flush()[0]
    expect(result.WARN).toBe(true)
})

test('Add Node exceptions', async() => {
    let log: any = new SenseLogs()
    log.addNodeExceptions()
    expect(log instanceof SenseLogs).toBe(true)
})

test('Add Browser exceptions', async() => {
    let log: any = new SenseLogs()
    let g: any = global
    g.window = global
    log.addUncaughtExceptions()
    expect(log instanceof SenseLogs).toBe(true)
})
