# Pipeline
A simple utility that pipes a value through middlewares.

## Why?
We all know what Pipelines are. Pipes and middlewares have already been used a ton, and there are already a number of fantastic libriaries/projects out there.

Though, sometimes you need something smaller that doesn't have any preconceived uses in mind. This utility was specifically designed for easy use and is completely unopinionated about how it gets used.

## Usage

Pipeline is built with TypeScript, but this is not a requirement to use it. The following usage documentation is written with TypeScript in mind for brevity.

### Pipeline (constructor)

Constructor that creates a pipeline. Optionally, you can front-load middwares by suppling an iterable collection of middlewares as a constructor argument. Middlwares are executed in order. Any non-array iterable will be converted to an array automatically. If no iterable is supplied via constructor, any value passed will simply be returned, unmodified.

Pipeline is generic and requires one type parameter `T`, where `T` is the type of value that will be passed to each middlware.

```javascript
let pipe = new Pipeline<string>();

// This pipeline expects middlewares that accept a string as its first parameter (see middleware below).

// or...

let identityPipe = new Pipeline<string>([
	(str, next) => next(str);
]);
```

### Pipeline\#use

Optionally, you can add a middlware after the construction of a Pipeline. Middlewares added via `use()` are executed in order. If middlewares are supplied via constructor arguement, any middlwares added after the fact via `use()` will simply be added to the iterable.

```javascript
let pipe = new Pipeline<string>();

pipe.use((str, next) => next(str));

// or, construct a front-loaded Pipeline and add more middlewares later

let frontLoadedPipe = new Pipeline<string>([
	(str, next) => next(str);
]);

frontLoadedPipe.use((str, next) => {
	next(str + '--add-some-string');
});

```

### Pipeline\#run

Takes a value as an argument, and returns a promise containing the resulting value. Each registered middleware will be run in order, as long as the pipeline is not short-circuited (see middleware below). The value passed to `run()` must satisfy the type specified when constructing the pipeline.

```javascript
let pipe = new Pipeline<string>([
	(str, next) => next(str + '--1');
	(str, next) => next(str + '--2');
]);

pipe.run('bacon').then(val => {
	// val = 'bacon--1--2'
});
```

Pipelines can be run many times, as long as subsequent `run()` calls occur within the context of the pipeline's returned promise.

**Concurrent `run()` calls are not supported, and will result in bad, unpredicable things. If this behavior is desired, then go for it.**

### Middleware

Middlewares are just functions that are provided four arguments.
- `value: T` - A value passed from `run()`, or from a previously run middleware
- `next: value<T> => void` - Triggers the next middleware in the pipeline. If invoked in the last middware of the pipeline, the pipeline will automatically resolve the returned promise. This helps ensure each middlware is contained and knows nothing about how it's being used within the pipeline.
- `resolve: (value?: T | PromiseLike<T>) => void` - Resolves the pipeline early. Invoking `resolve` results in skipping any subsequent middlewares, thus "short-circuiting" the pipeline, and resolving the pipeline's returned promise.
- `reject: (reason?: any) => void` - Rejects the pipeline early. Invoking `reject` results in skipping any subsequent middlewares, thus "short-circuiting" the pipeline, and rejecting the pipeline's returned promise. The expectation is to pass a rejection reason, but anything can be passed to `reject` (like errors);

One of the virtues of Pipeline is that each middleware can be control when the pipeline's execution can continue. This allows for some slick ways to control flow of execution either synchronously or asynchronously. Take this naive example:

```javascript
let middleware = (value, next, resolve, reject) => {
	http.get(`some/resource?id=${value}`)
		.then(res => {
			// do something with res
			next(value);
		}, err => {
			reject(err);
		});
};
```

If the http call is successful, we pass the value to the next middleware (if any). Otherwise, we short-circuit the pipeline by passing the http error to `reject`.

### Examples

#### Using Generators
Sometimes, we want to create our middlewares dynamically. Since `Pipeline` takes an iterator, we can pass an invoked generator function.

```javascript
type TRequest = { url: string, headers: Headers }

const pw = 'SOME_APP_KEY';
const username = 'SOME_USER_NAME';
const bytes = utf8.encode(`${username}:${pw}`);
const encodedCreds = base64.encode(`${username}:${pw}`);

const page = (_pageNumber, _pageSize) => {
	return ({ url, headers }, next, resolve, reject) => {
		let _url = `${url}?offset=${_pageNumber*_pageSize}&limit=${_pageSize}`;
		return fetch(_url, {
			headers
		}).then(res => {
			res.json().then(json => {
				fs.writeFile(`${__dirname}/tmp/result${_pageNumber}.json`, JSON.stringify(json.info), (err) => {
					if(err) {
						reject(err);
					}

					next({ url, headers });
					console.log('The file was saved!');
				});
			}, err => {
				reject(err);
			});
		};
	};
};

const pager = function* (_page) {
	let p = _page;
	while (p < 11) {
		yield page(p, 1);
		p ++;
	}
};

let asyncPipe = new Pipeline<TRequest>(pager(0));
let headers = new Headers();
headers.set('Authorization', `Basic ${encodedCreds}`);

asyncPipe.run({
	url: `http://some/api/resource`,
	headers
}).then(res => {
	console.log('success!');
}, err => {
	console.log(err);
});