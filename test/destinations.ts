/*
    json.ts -
 */
import {SenseLogs, print, dump, delay} from './utils/init'

// jest.setTimeout(7200 * 1000)

test('JSON', async() => {
    const log = new SenseLogs({destination: 'json'})
    //  Can't capture result so just test all proceeds.
    log.info('Hello World')
    expect(true).toBe(true)
})

test('Console', async() => {
    const log = new SenseLogs({destination: 'console'})
    //  Can't capture result so just test all proceeds.
    log.info('Hello World')
    expect(true).toBe(true)
})

test('Console', async() => {
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

