/*
    filter.ts -
 */
import {SenseLogs} from './utils/init'

// jest.setTimeout(7200 * 1000)

const DefaultFilter = ['fatal', 'error', 'metrics', 'info', 'warn']

test('SetFilter', async() => {
    const log = new SenseLogs({destination: 'capture'})

    //  Should clear levels and then set only error
    log.setFilter()
    log.setFilter('error')

    log.info('Hello World')
    let result = log.flush()
    expect(result.length).toBe(0)

    log.error('Boom')
    result = log.flush()
    expect(result.length).toBe(1)
    expect(result[0]).toMatchObject({
        'message': 'Boom'
    })
})

test('SetFilter default', async() => {
    const log = new SenseLogs({destination: 'capture'})

    //  Default should restore levels
    log.setFilter()
    log.setFilter('default')

    log.info('Hello World')
    let result = log.flush()
    expect(result.length).toBe(1)

    log.error('Boom')
    result = log.flush()
    expect(result.length).toBe(1)
})

test('SetOverride', async() => {
    const log = new SenseLogs({destination: 'capture'})

    //  Clear all filters
    log.setFilter()
    log.setOverride()
    log.setSample()

    let override = log.getOverride()
    expect(override).toMatchObject({})

    let sample = log.getSample()
    expect(sample).toMatchObject({})

    //  Set override for 60 seconds for errors
    let expire = new Date(Date.now() + 60 * 1000)
    log.setOverride('error', expire)

    log.info('Hello World')
    let result = log.flush()
    expect(result.length).toBe(0)

    log.error('Boom')
    result = log.flush()
    expect(result.length).toBe(1)
    expect(result[0]).toMatchObject({
        'message': 'Boom'
    })

    //  Set an expired override
    expire = new Date(Date.now() - 1)
    log.setOverride('error', expire)
    log.error('Boom')
    result = log.flush()
    expect(result.length).toBe(0)

    //  Clear override
    log.setOverride()
    log.error('Boom')
    result = log.flush()
    expect(result.length).toBe(0)


    //  Set override
    log.setOverride('error')

    //  Override with array and null
    log.setOverride(['error', null, 'info'])
})

test('AddFilters', async() => {
    const log = new SenseLogs({destination: 'capture'})

    let filter = log.getFilter()
    expect(filter).toMatchObject(DefaultFilter)

    log.addFilter()
    log.addFilter([])
    log.addFilter([null])
    filter = log.getFilter()
    expect(filter).toMatchObject(DefaultFilter)
})

test('SetSample', async() => {
    const log = new SenseLogs({destination: 'capture'})

    //  Clear all filters
    log.setFilter()
    log.setOverride()
    log.setSample()

    let sample = log.getSample()
    expect(sample).toMatchObject({})

    //  Set sample for 100%
    log.setSample('info', 100)
    log.info('Hello World')
    let result = log.flush()
    expect(result.length).toBe(1)

    //  Set sample to be 0%
    log.setSample('info', 0)
    log.info('Hello World')
    result = log.flush()
    expect(result.length).toBe(0)

    //  Full sample
    //  Set sample for 100%
    log.setSample('info', 10)
    for (let i = 0; i < 10; i++) {
        log.info('Hello World')
    }
    result = log.flush()
    expect(result.length).toBe(1)


    //  Clear sample
    log.setSample('info')

    //  Sample with array and null
    log.setSample(['error', null, 'info'], 100)
    log.setSample(['error', null, 'info'], 0)

    //  Overrate
    log.setSample('error', 101)
})
