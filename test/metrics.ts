/*
    metrics.ts -
 */
import {SenseLogs, cap} from './utils/init'

// jest.setTimeout(7200 * 1000)

test('metrics', async() => {
    const log = new SenseLogs({name: 'test', destination: 'capture'})

    log.metrics('metrics', 'Acme Metrics', 'Acme/Rockets', {sessions: 1})
    let result: any = log.flush()[0]
    let message = result.message
    expect(message.indexOf('{"_aws":') >= 0).toBe(true)
    expect(message.indexOf('"Namespace":"Acme/Rockets"') > 0).toBe(true)
    expect(message.indexOf('"Name":"sessions"') > 0).toBe(true)
})

test('metrics via JSON', async() => {
    const log = new SenseLogs()

    cap()
    log.metrics('metrics', 'Acme Metrics', 'Acme/Rockets', {sessions: 1})
    cap(false)
})

test('metrics when disabled', async() => {
    const log = new SenseLogs()
    log.setFilter()
    log.metrics('metrics', 'Acme Metrics', 'Acme/Rockets', {sessions: 1})
})

test('metrics scenarios', async() => {
    const log = new SenseLogs()
    // log.metrics('metrics', 'Acme Metrics', 'Acme/Rockets', {sessions: 1})
})
