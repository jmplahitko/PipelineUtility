import 'jasmine';
import { createPipe } from '../src';
import type { NextOperator } from '../src';

// @ts-ignore - purposely invalid
const invalidOperators = createPipe({});

describe('createPipe', () => {
	it('should throw if given non-iterable operators', async () => {
		await invalidOperators('test')
			.catch(e => {
				expect(e).toBeInstanceOf(TypeError);
			});
	});
});

const someAsyncOperation = (value: number): Promise<number> =>
	Promise.resolve(value + 1);

describe('Examples', () => {
	it('Example 1: Simple synchronous operations', async () => {
		const addTenPipe = createPipe<number>([
			(value, next) => {
				next(value + 10);
			}
		]);

		const result = await addTenPipe(5);

		expect(result).toEqual(15);
	});

	it('Example 2: Multiple operations', async () => {
		const mathPipe = createPipe<number>([
			(value, next) => {
				next(value + 10);
			},
			(value, next) => {
				next(value * 2);
			},
			(value, next) => {
				next(value - 5);
			}
		]);

		const result = await mathPipe(5);

		expect(result).toEqual(25); // Output: 25 ((5 + 10) * 2 - 5)
	});

	it('Example 3: Early resolution', async () => {
		const earlyResolvePipe = createPipe<number>([
			(value, next, resolve) => {
				if (value < 0) {
					resolve(0); // Early exit if negative
				} else {
					next(value);
				}
			},
			(value, next) => {
				next(value * 2); // This won't run for negative numbers
			}
		]);

		const results = await Promise.all([
			await earlyResolvePipe(-5),
			await earlyResolvePipe(5)
		]);

		expect(results).toEqual([0, 10]);
	});

	it('Example 4: Error handling', async () => {
		const errorMessage = 'Negative numbers not allowed';
		const validatePipe = createPipe<number>([
			(value, next, resolve, reject) => {
				if (value < 0) {
					reject(new Error(errorMessage));
				} else {
					next(value);
				}
			}
		]);

		await validatePipe(-5)
			.catch(error => {
				expect(error).toBeInstanceOf(Error);
				expect(error.message).toEqual(errorMessage);
			});

		const result = await validatePipe(5);

		expect(result).toEqual(5);
	});

	it('Example 5: Async operations', async () => {
		const asyncPipe = createPipe<number>([
			async (value, next) => {
				const result = await someAsyncOperation(value);
				next(result);
			},
			(value, next) => {
				next(value * 2);
			}
		]);

		const result = await asyncPipe(5);

		expect(result).toEqual(12);
	});

	const fetchPaginatedData = async (page: number, pageSize: number) => ({
		data: Array.from({ length: pageSize }, (_, i) => (page - 1) * pageSize + i),
		hasMore: page < 3
	});

	it('Example 6: Accumulating paginated data with generators', async () => {
		const generateMiddleware = function* () {
			let page = 1;
			let hasMore = true;

			while (hasMore) {
				yield async (data: number[], next: NextOperator<number[]>) => {
					const response = await fetchPaginatedData(page, 10);
					hasMore = response.hasMore;
					page++;
					next([...data, ...response.data]); // Accumulate data through the pipe
				};
			}
		};

		const pipe = createPipe<number[]>(generateMiddleware());

		const results = await pipe([]); // Start with empty array

		// Assertions
		expect(results.length).toBe(30); // Total items across all pages
		expect(results.slice(0, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]); // First page
		expect(results.slice(10, 20)).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]); // Second page
		expect(results.slice(20, 30)).toEqual([20, 21, 22, 23, 24, 25, 26, 27, 28, 29]); // Third page
	});
});
