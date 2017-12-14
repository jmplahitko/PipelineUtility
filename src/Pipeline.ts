'use strict';

function noop() {};

export type TResolve<T> = (value?: T | PromiseLike<T>) => void;
export type TReject = (reason?: any) => void;
export type TMiddleware<T> = (value: T, next: (value: T) => void, resolve: TResolve<T>, reject: TReject) => void;

export class Pipeline<T> {
	private _iterable: Array<TMiddleware<T>> = [];
	private _iterator: Iterator<TMiddleware<T>>|null = null;
	private _resolve: TResolve<T>|null = null;
	private _reject: TReject|null = null;

	constructor(iterable: Iterable<TMiddleware<T>> = []) {
		if (!iterable[Symbol.iterator]) {
			throw new TypeError(`Pipeline expects an iterable, got ${typeof iterable}`);
		}

		this._iterable = Array.from(iterable);
	}

	private _done(value: any, err?: boolean): void {
		if (this._iterator) {

			if (err) {
				(this._reject || noop)(value);
			} else {
				(this._resolve || noop)(value);
			}

			this._iterator = null;
			this._resolve = null;
			this._reject = null;
		}
	}

	private _next(value: T): void {
		if (this._iterator) {
			let it: IteratorResult<TMiddleware<T>> = this._iterator.next();

			if (!it.done) {
				it.value(value,
					this._next.bind(this),
					(_val: any) => { this._done.call(this, _val); },
					(_val: any) => { this._done.call(this, _val, true); }
				);
			} else {
				this._done(value);
			}
		}
	}

	public run(value: T): Promise<any> {
		if (!this._iterator) {
			this._iterator = this._iterable[Symbol.iterator]();
			let promise = new Promise<T>((resolve, reject) => {
				this._resolve = resolve;
				this._reject = reject;
			});

			this._next(value);

			return promise;
		} else {
			throw new Error('Pipeline.run() is already in progress');
		}
	}

	public use(middleware: TMiddleware<T>): Pipeline<T> {
		if (!this._iterator) {
			this._iterable.push(middleware);
			return this;
		} else {
			throw new Error('Pipeline.use() cannot be called when pipeline is running');
		}
	}
}