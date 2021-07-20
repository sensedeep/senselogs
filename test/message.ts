/*
    message.ts
 */
import {SenseLogs, print, dump, delay} from './utils/init'

// jest.setTimeout(7200 * 1000)

test('Context messages', async() => {
    const log = new SenseLogs({destination: 'capture'})

    log.info('Hello World', {message: 'embedded'})
    let result = log.flush()
    expect(result.length).toBe(1)
    expect(result[0]).toMatchObject({
        '@level': 'info',
        '@message': 'embedded',
        'message': 'Hello World',
    })
})

test('Object message', async() => {
    const log = new SenseLogs({destination: 'capture'})

    log.info({greeting: 'Hello World'} as unknown as string)
    let result = log.flush()
    expect(result.length).toBe(1)
    expect(result[0]).toMatchObject({
        '@level': 'info',
        'message': '{"greeting":"Hello World"}',
    })
})
