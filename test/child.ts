/*
    child.ts - child()
 */
import {SenseLogs} from './utils/init'

test('child instance', async() => {
    const log = new SenseLogs({destination: 'capture'})

    let child = log.child()
    child.info('Hello World')

    let result = child.flush()
    expect(result.length).toBe(1)
    expect(result[0]).toMatchObject({
        'message': 'Hello World',
    })
})

test('child scenarios', async() => {
    const log = new SenseLogs({destination: 'capture'})

    let child = log.child({source: 'greeting'})
    child.info('Hello World')

    let result = child.flush()
    expect(result.length).toBe(1)
    expect(result[0]).toMatchObject({
        'source': 'greeting',
        'message': 'Hello World',
    })
})
