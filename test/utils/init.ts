import SenseLogs from '../../src/index'

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

export {SenseLogs, delay, dump, print}
