/*
    methods.ts -
 */
import {SenseLogs} from './utils/init'

// jest.setTimeout(7200 * 1000)

test('Test methods', async() => {
    const log = new SenseLogs({destination: 'capture'})

    log.addFilter(['data', 'debug', 'trace'])
    log.data('Hello Data')
    log.debug('Hello Debug')
    log.error('Hello Error')
    log.fatal('Hello Fatal')
    log.info('Hello Info')
    log.warn('Hello Warn')
    log.trace('Hello Trace')

    let result = log.flush()
    expect(result.length).toBe(7)
})

test('Test methods with context', async() => {
    const log = new SenseLogs({destination: 'capture'})

    log.addFilter(['data', 'debug', 'trace'])
    let context = {
        weather: 'sunny',
        temp: 99,
    }
    log.data('Hello Data', {context})
    log.debug('Hello Debug', {context})
    log.error('Hello Error', {context})
    log.fatal('Hello Fatal', {context})
    log.info('Hello Info', {context})
    log.warn('Hello Warn', {context})
    log.trace('Hello Trace', {context})
    log.silent('Hello Trace', {context})

    let result = log.flush()
    expect(result.length).toBe(7)
})

test('Test assert ', async() => {
    const log = new SenseLogs({destination: 'capture'})

    log.addFilter(['assert'])

    log.assert(true)
    expect(log.flush().length).toBe(0)

    log.assert(1)
    expect(log.flush().length).toBe(0)

    log.assert(2 == (1+1))
    expect(log.flush().length).toBe(0)

    log.assert(false)
    let result: any = log.flush()
    expect(result.length).toBe(1)
    expect(result[0].message).toBe('Assert failed')
    expect(result[0]['@chan']).toBe('assert')

    log.assert(1 == (1 + 1))
    expect(log.flush().length).toBe(1)

    log.assert(null)
    expect(log.flush().length).toBe(1)

    log.assert(0/0)
    expect(log.flush().length).toBe(1)

    log.assert('false')
    expect(log.flush().length).toBe(1)

    log.assert(false, 'Custom Message')
    result = log.flush()
    expect(result.length).toBe(1)
    expect(result[0].message).toBe('Assert failed: Custom Message')

    log.assert(false, 'Custom Message', {weather: 'sunny'})
    result = log.flush()
    expect(result.length).toBe(1)
    expect(result[0].message).toBe('Assert failed: Custom Message')
    expect(result[0].weather).toBe('sunny')
    expect(result[0]['@chan']).toBe('assert')
})
