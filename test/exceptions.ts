/*
    exceptions.ts -
 */
import {SenseLogs, print, dump, delay} from './utils/init'

// jest.setTimeout(7200 * 1000)

test('Exception message', async() => {
    const log = new SenseLogs({name: 'test', destination: 'capture'})

    log.info(new Error('boom'))
    let result = log.flush()[0]
    expect(result).toMatchObject({
        'message': 'boom',
    })
    expect(result['@exception'] instanceof Error)
    expect(result['@exception'].message == 'boom')
})

test('Exception context', async() => {
    const log = new SenseLogs({name: 'test', destination: 'capture'})

    log.info('Hello World', new Error('boom'))
    let result = log.flush()[0]
    expect(result).toMatchObject({
        'message': 'Hello World',
    })
    expect(result['@exception'] instanceof Error)
    expect(result['@exception'].message == 'boom')
})

test('Exception in context', async() => {
    const log = new SenseLogs({name: 'test', destination: 'capture'})

    log.info('Hello World', {err: new Error('boom')})
    let result = log.flush()[0]
    expect(result).toMatchObject({
        'message': 'Hello World',
    })
    expect(result['@exception'] instanceof Error)
    expect(result['@exception'].message == 'boom')
})

test('Capture stack', async() => {
    const log = new SenseLogs({name: 'test', destination: 'capture'})

    log.info('Hello World', {'@stack': true})
    let result = log.flush()[0]
    expect(result).toMatchObject({
        'message': 'Hello World',
    })
    expect(result['@stack']).toBeDefined()
    expect(result['@stack'].length > 0).toBe(true)
    expect(result['@stack'][0].indexOf('at ')).toBe(0)
})
