/*
    json.ts -
 */
import {SenseLogs, print, dump, delay, output} from './utils/init'

// jest.setTimeout(7200 * 1000)

test('JSON', async() => {
    const log = new SenseLogs({destination: 'json'})

    let save = output('stdout')
    log.info('Hello World')
    expect(true).toBe(true)
    output('stdout', save)
})

test('Console', async() => {
    const log = new SenseLogs({destination: 'console'})

    let saveLog = output('stdout')
    let saveError = output('stderr')

    log.info('Hello World')
    expect(true).toBe(true)

    log.error(new Error('boom'))
    expect(true).toBe(true)

    log.error('', new Error('boom'))
    expect(true).toBe(true)

    log.error('Boom')
    expect(true).toBe(true)

    log.addFilter('trace')
    log.trace('Trace message')
    expect(true).toBe(true)

    log.metrics('Acme/Rockets', {sessions: 1})
    expect(true).toBe(true)

    log.addContext({one: 1, two: 2})
    log.info('Hello World')
    expect(true).toBe(true)

    log.error('Hello World')
    expect(true).toBe(true)

    output('stdout', saveLog)
    output('stderr', saveError)
})

test('Destination', async() => {
    let result = []
    const log = new SenseLogs({
        destination: {
            write: (log, context) => {
                result.push(context)
            }
        }
    })
    log.info('Hello World')
    expect(result.length).toBe(1)
    expect(result[0]).toMatchObject({
        'message': 'Hello World',
    })
})

test('Set Destination', async() => {
    let result = [], buf = []

    const log = new SenseLogs({destination: 'capture'})

    log.setDestination({
        write: (log, context) => {
            buf.push(context)
        }
    })
    log.info('Hello World')
    expect(result.length).toBe(0)
    expect(buf.length).toBe(1)
    expect(buf[0]).toMatchObject({
        'message': 'Hello World',
    })
})
