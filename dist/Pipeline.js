'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
function noop() { }
;
class Pipeline {
    constructor(iterable = []) {
        this._iterable = [];
        this._iterator = null;
        this._resolve = null;
        this._reject = null;
        if (!iterable[Symbol.iterator]) {
            throw new TypeError(`Pipeline expects an iterable, got ${typeof iterable}`);
        }
        this._iterable = Array.from(iterable);
    }
    _done(value, err) {
        if (this._iterator) {
            this._iterator = null;
            if (err) {
                (this._reject || noop)(value);
                return;
            }
            (this._resolve || noop)(value);
        }
        else {
            this._iterator = null;
            this._resolve = null;
            this._reject = null;
            throw new Error('Pipeline:_done() cannot be called out of context of Pipeline.run()');
        }
    }
    _next(value) {
        if (this._iterator) {
            let it = this._iterator.next();
            if (!it.done) {
                it.value(value, this._next.bind(this), (_val) => { this._done.call(this, _val); }, (_val) => { this._done.call(this, _val, true); });
            }
            else {
                this._done(value);
            }
        }
        else {
            this._iterator = null;
            this._resolve = null;
            this._reject = null;
            throw new Error('Pipeline:_next() cannot be called out of context of Pipeline.run()');
        }
    }
    run(value) {
        if (!this._iterator) {
            this._iterator = this._iterable[Symbol.iterator]();
            let promise = new Promise((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
            });
            this._next(value);
            return promise;
        }
        else {
            throw new Error('Pipeline.run() is already in progress');
        }
    }
    use(middleware) {
        if (!this._iterator) {
            this._iterable.push(middleware);
            return this;
        }
        else {
            throw new Error('Pipeline.use() cannot be called when pipeline is running');
        }
    }
}
exports.Pipeline = Pipeline;
