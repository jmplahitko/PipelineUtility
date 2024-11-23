import { partial } from 'ramda';
function next(iterator, resolve, reject, value) {
    const it = iterator.next();
    if (!it.done) {
        it.value(value, partial(next, [iterator, resolve, reject]), resolve, reject);
    }
    else {
        resolve(value);
    }
}
export function createPipe(operators) {
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
