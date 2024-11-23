"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPipe = createPipe;
const ramda_1 = require("ramda");
function next(iterator, resolve, reject, value) {
    const it = iterator.next();
    if (!it.done) {
        it.value(value, (0, ramda_1.partial)(next, [iterator, resolve, reject]), resolve, reject);
    }
    else {
        resolve(value);
    }
}
function createPipe(operators) {
    return (value) => {
        return new Promise((resolve, reject) => {
            try {
                const iterator = operators[Symbol.iterator]();
                next(iterator, resolve, reject, value);
            }
            catch (e) {
                reject(e);
            }
        });
    };
}
