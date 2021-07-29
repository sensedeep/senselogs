
import fs from 'fs'
import Pino from 'pino'
import SenseLogs from '../src/index.js'

const Iter = 2000000

function senseLogsConsole() {
    let log = new SenseLogs({destination: 'console'})
    for (let i = 0; i < Iter; i++) {
        log.info('Hello World')
    }
}

function senseLogsNull() {
    let log = new SenseLogs({destination: { write: () => {} }})
    for (let i = 0; i < Iter; i++) {
        log.info('Hello World')
    }
}

function pinoConsole() {
    let pino = Pino()
    for (let i = 0; i < Iter; i++) {
        pino.info('Hello World')
    }
}

function pinoNull() {
    let pino = Pino(Pino.destination('/dev/null'))
    for (let i = 0; i < Iter; i++) {
        pino.info('Hello World')
    }
}


function bench(lib, fn) {
    let start = new Date()
    fn()
    console.log(`${lib} elapsed ${new Date() - start}\n`)
}

function main() {
    for (let i = 2; i < process.argv.length; i++) {
        let arg = process.argv[i]
        if (arg == 'senselogs') {
            bench('SenseLogs', senseLogsNull)
        } else if (arg == 'senselogs-console') {
            bench('SenseLogs', senseLogsConsole)
        } else if (arg == 'pino') {
            bench('Pino', pinoNull)
        } else if (arg == 'pino-console') {
            bench('Pino', pinoConsole)
        }
    }
}

main()
