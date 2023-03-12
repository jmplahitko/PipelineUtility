import 'jasmine';
import { multiply, concat } from 'ramda';
import { createPipe } from '../src';

const addString1 = (val, next) => next(concat(val, '-1'));
const addString2 = (val, next) => next(concat(val, '-2'));
const addString3 = (val, next) => next(concat(val, '-3'));
const x2 = (val, next) => next(multiply(2, val));

const stringConcatPipe = createPipe<string>([
	addString1,
	addString2,
	addString3,
]);

const power2 = createPipe<number>([x2, x2, x2]);

// @ts-ignore
const invalidOperators = createPipe({});

describe('createPipe', () => {
	it('should pass a string value that can be mutated', async () => {
		const result = await stringConcatPipe('test');
		expect(result).toEqual('test-1-2-3');
	});

	it('should pass a number value that can be mutated', async () => {
		const result = await power2(3);
		expect(result).toEqual(24);
	});

	it('should run two isolated pipes simultaneously', async () => {
		const [ result1, result2 ] = await Promise.all([
			stringConcatPipe('test'),
			power2(3)
		]);

		expect(result1).toEqual('test-1-2-3');
		expect(result2).toEqual(24);
	});

	it('should throw if given non-iterable operators', async () => {
		await invalidOperators('test')
			.catch(e => {
				expect(e).toBeInstanceOf(TypeError);
			});
	});
});
