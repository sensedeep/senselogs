/*
    context.ts -
 */
import {SenseLogs, print, dump, delay} from './utils/init'

// jest.setTimeout(7200 * 1000)

test('addContext', async() => {
    const log = new SenseLogs({name: 'test', destination: 'capture'})

    expect(Object.keys(log.context).length).toBe(0)
    log.addContext({
        source: 'context.ts'
    })
    expect(Object.keys(log.context).length).toBe(1)

    log.info('Hello World')
    let result = log.flush()
    expect(result.length).toBe(1)
    expect(result[0]).toMatchObject({
        'message': 'Hello World',
        'source': 'context.ts',
    })
})

test('clearContext', async() => {
    const log = new SenseLogs({name: 'test', destination: 'capture'})

    expect(Object.keys(log.context).length).toBe(0)

    log.addContext({
        source: 'context.ts'
    })
    expect(Object.keys(log.context).length).toBe(1)

    log.clearContext()
    expect(Object.keys(log.context).length).toBe(0)

    log.info('Hello World')
    let result: any = log.flush()[0]
    expect(result).toMatchObject({'message': 'Hello World'})
    expect(result.source).toBeUndefined()
})