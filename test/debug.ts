/*
    debug.ts - Just for debug
 */
import {SenseLogs, print, dump, delay} from './utils/init'

jest.setTimeout(7200 * 1000)

test('Mock', async() => {
    const log = new SenseLogs({name: 'test', destination: 'capture'})
    log.info('Hello World')

    let result = log.flush()
    expect(result.length).toBe(1)
    expect(result[0]).toMatchObject({
        '@level': 'info',
        '@module': 'test',
        'message': 'Hello World'
    })
})
