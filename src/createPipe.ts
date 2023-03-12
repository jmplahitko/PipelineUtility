
import { partial } from 'ramda';

type Next<T = any> = (value: T) => void;
type Operator<T, E extends Error> = (value: T, next: Next<T>, resolve: Resolve<T>, reject: Reject<E>) => void;
type Resolve<T> = (value: T | PromiseLike<T>) => void;
type Reject<E extends Error = Error> = (error: E) => void;

function next<T, E extends Error = Error>(iterator: Iterator<Operator<T, E>, T>, resolve: Resolve<T>, reject: Reject, value: T) {
	const it = iterator.next();

	if (!it.done) {
		it.value(
			value,
			partial(next, [iterator , resolve, reject]),
			resolve,
			reject
		);
	} else {
		resolve(value);
	}
}

export function createPipe<T, E extends Error = Error>(operators: Iterable<Operator<T, E>>) {
	return (value: T): Promise<T> => {
		return new Promise<T>((resolve: Resolve<T>, reject: Reject) => {
			try {
				const iterator: Iterator<Operator<T, E>, T> = operators[Symbol.iterator]();
				next<T>(iterator, resolve, reject, value);
			} catch(e: any) {
				reject(e);
			}
		});
	}
}