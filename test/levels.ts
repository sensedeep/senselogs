/*
    levels.ts -
 */
import {SenseLogs, print, dump, delay} from './utils/init'

// jest.setTimeout(7200 * 1000)

const DefaultLevels = ['data', 'debug', 'error', 'fatal', 'info', 'trace', 'warn']

test('AddLevels', async() => {
    const log = new SenseLogs({destination: 'capture'})

    let levels = log.getLevels()
    expect(levels).toMatchObject(DefaultLevels)

    log.addLevels()
    log.addLevels([])
    log.addLevels([null])
    levels = log.getLevels()
    expect(levels).toMatchObject(DefaultLevels)
})

test('SetLevels', async() => {
    const log = new SenseLogs({destination: 'capture'})

    let levels = log.getLevels()
    expect(levels).toMatchObject(DefaultLevels)

    log.setLevels('custom')
    levels = log.getLevels()
    expect(levels).toMatchObject(['custom'])
})

test('AddLevels duplicate', async() => {
    const log = new SenseLogs({destination: 'capture'})

    await expect(async() => {
        log.addLevels('info')
    }).rejects.toThrow()
})

test('Emit', async() => {
    const log = new SenseLogs({destination: 'capture'})

    log.emit('info', 'Hello World')
    let result = log.flush()
    expect(result.length).toBe(1)
    expect(result[0]).toMatchObject({
        'message': 'Hello World',
    })
})
