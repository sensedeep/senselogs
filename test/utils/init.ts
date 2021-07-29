import process from 'process'
import {Stream} from 'stream'
import SenseLogs from '../../src/index'

function nop() {}

function output(stream, where?: Stream): any {
    let prior = process.stdout.write
    if (where) {
        process[stream].write = where as any
    } else {
        process[stream].write = nop as any
    }
    return prior
}

const dump = (...args) => {
    let s = []
    for (let item of args) {
        s.push(JSON.stringify(item, function (key, value) {
            if (this[key] instanceof Date) {
                return this[key].toLocaleString()
            }
            return value
        }, 4))
    }
    console.log(s.join(' '))
}

const print = (...args) => {
    console.log(...args)
}

const delay = async (time) => {
    return new Promise(function(resolve, reject) {
        setTimeout(() => resolve(true), time)
    })
}

export {SenseLogs, delay, dump, output, print}
