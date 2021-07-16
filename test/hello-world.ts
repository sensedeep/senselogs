/*
    hello-world.ts - Can we breathe
 */
import {SenseLogs, print, dump, delay} from './utils/init'

// jest.setTimeout(7200 * 1000)

test('Hello World', async() => {
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