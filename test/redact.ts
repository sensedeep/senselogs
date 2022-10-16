/*
    redact.ts -
 */
import {SenseLogs} from './utils/init'

// jest.setTimeout(7200 * 1000)

test('Redact basic', async() => {
    const log: any = new SenseLogs({
        destination: 'capture',
        redact: (context: any) => {
            context.message = '[REDACTED]'
            return context
        }
    })
    log.info('Hello World')
    let result: any = log.flush()[0]
    expect(result.message).toBe('[REDACTED]')
})

test('Redact and delete', async() => {
    const log: any = new SenseLogs({
        destination: 'capture',
        redact: (context: any) => {
            context.message = '[REDACTED]'
            return null
        }
    })
    log.info('Hello World')
    let result: any = log.flush()
    expect(result.length).toBe(0)
})
