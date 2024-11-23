
import { partial } from 'ramda';

export type NextOperator<T = any> = (value: T) => void;
export type Operator<T, E extends Error> = (value: T, next: NextOperator<T>, resolve: ResolvePipe<T>, reject: RejectPipe<E>) => void;
export type ResolvePipe<T> = (value: T | PromiseLike<T>) => void;
export type RejectPipe<E extends Error = Error> = (error: E) => void;

function next<T, E extends Error = Error>(iterator: Iterator<Operator<T, E>, T>, resolve: ResolvePipe<T>, reject: RejectPipe<E>, value: T) {
	const it = iterator.next();

	if (!it.done) {
		it.value(
			value,
			partial(next, [iterator, resolve, reject]),
			resolve,
			reject
		);
	} else {
		resolve(value);
	}
}

export function createPipe<T, E extends Error = Error>(operators: Iterable<Operator<T, E>>) {
	return (value: T): Promise<T> => {
		return new Promise<T>((resolve: ResolvePipe<T>, reject: RejectPipe<E>) => {
			try {
				const iterator: Iterator<Operator<T, E>, T> = operators[Symbol.iterator]();
				next<T, E>(iterator, resolve, reject, value);
			} catch (e: any) {
				reject(e);
			}
		});
	}
}