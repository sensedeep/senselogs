/*
    formats.ts -
 */
import {SenseLogs, print, dump, delay, cap} from './utils/init'

jest.setTimeout(7200 * 1000)

test('JSON format', async() => {
    const log = new SenseLogs({destination: 'capture', format: 'json'})

    log.info('Hello World')
    let message: any = log.flush('message')[0]
    expect(typeof message).toBe('string')
    expect(message[0]).toBe('{')
    expect(JSON.parse(message)).toMatchObject({
        message: 'Hello World',
        '@chan': 'info',
    })
})

test('human readable format', async() => {
    const log = new SenseLogs({destination: 'capture', format: 'human'})

    log.info('Hello World')
    let message: any = log.flush('message')[0]
    expect(message.match(/\d\d:\d\d:\d\d: INFO: Hello World/) != null).toBe(true)

    //  Coverage
    log.info('Boom', {weather: 'sunny'})
    log.error('Boom')
    log.error(new Error('Boom'), {weather: 'sunny'})
})

test('tsv format', async() => {
    const log = new SenseLogs({destination: 'capture', format: 'tsv'})

    log.info('Hello World')
    let data: any = log.flush('message')[0]
    let items = data.split('\t')
    expect(items.length > 0).toBe(true)
})

test('keyvalue format', async() => {
    const log = new SenseLogs({destination: 'capture', format: 'keyvalue'})

    log.info('Hello World')
    let data: any = log.flush('message')[0]
    let items = data.split(',')
    expect(items.filter(i => i.split('=')).length).toBe(items.length)
})

test('custom format', async() => {
    const log = new SenseLogs({destination: 'capture', format: (context) => {
        return 'CUSTOM'
    }})
    log.info('Hello World')
    let message: any = log.flush('message')[0]
    expect(message).toBe('CUSTOM')
})

test('unknown format', async() => {
    const log = new SenseLogs({destination: 'capture', format: 'unknown'})

    //  Defaults to json output
    log.info('Hello World')

    let message: any = log.flush('message')[0]
    expect(typeof message).toBe('string')
    expect(message[0]).toBe('{')
    expect(JSON.parse(message)).toMatchObject({
        message: 'Hello World',
        '@chan': 'info',
    })
})
