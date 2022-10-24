import * as process from 'process'
import SenseLogs from '../../src/index'

function nop() {}

let stdout = process.stdout.write
let stderr = process.stderr.write
let consoleLog = console.log
let consoleError = console.error

function cap(disable = true): any {
    if (disable) {
        process.stdout.write = nop as any
        process.stderr.write = nop as any
        console.log = nop as any
        console.error = nop as any
    } else {
        process.stdout.write = stdout
        process.stderr.write = stderr
        console.log = consoleLog
        console.error = consoleError
    }
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

export {SenseLogs, delay, dump, cap, print}
