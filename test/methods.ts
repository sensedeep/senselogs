/*
    methods.ts - 
 */
import {SenseLogs, print, dump, delay} from './utils/init'

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

    let result = log.flush()
    expect(result.length).toBe(7)
})