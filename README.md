# pipeline-utility

`createPipe` is a utility function that creates a composable pipeline of operations that can handle both synchronous
and asynchronous operations. It's similar to a pipe or chain pattern, where each operator in the pipeline can:

* Process a value
* Pass it to the next operator
* Resolve early
* Reject with an error

## Installation

```bash
npm install pipeline-utility
```

## Usage

This utility's design is simple and allows for a lot of flexibility. Here are some examples of how to use it.

This package supports both CommonJS and ES Modules.

```ts
import { createPipe } from 'pipeline-utility';
```

```ts
const { createPipe } = require('pipeline-utility');
```

### Example 1: Simple synchronous operations

```ts
const addTenPipe = createPipe<number>([
	(value, next) => {
		next(value + 10);
	}
]);

const result = await addTenPipe(5);

expect(result).toEqual(15);
```

### Example 2: Multiple operations

```ts
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
```

### Example 3: Early resolution

```ts
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
```

### Example 4: Error handling

```ts
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
```

### Example 5: Async operations

```ts
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
```

### Example 6: Accumulating paginated data with generators

```ts
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

expect(results.length).toBe(30); // Total items across all pages
expect(results.slice(0, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]); // First page
expect(results.slice(10, 20)).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]); // Second page
expect(results.slice(20, 30)).toEqual([20, 21, 22, 23, 24, 25, 26, 27, 28, 29]); // Third page
```
