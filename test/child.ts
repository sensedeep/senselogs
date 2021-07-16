/*
    child.ts - child()
 */
import {SenseLogs, print, dump, delay} from './utils/init'

// jest.setTimeout(7200 * 1000)

test('child instance', async() => {
    const log = new SenseLogs({name: 'test', destination: 'capture'})

    let child = log.child()
    child.info('Hello World')

    let result = child.flush()
    expect(result.length).toBe(1)
    expect(result[0]).toMatchObject({
        '@level': 'info',
        '@module': 'test',
        'message': 'Hello World'
    })
})
