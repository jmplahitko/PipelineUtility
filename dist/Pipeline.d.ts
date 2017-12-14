export declare type TResolve<T> = (value?: T | PromiseLike<T>) => void;
export declare type TReject = (reason?: any) => void;
export declare type TMiddleware<T> = (value: T, next: (value: T) => void, resolve: TResolve<T>, reject: TReject) => void;
export declare class Pipeline<T> {
    private _iterable;
    private _iterator;
    private _resolve;
    private _reject;
    constructor(iterable?: Iterable<TMiddleware<T>>);
    private _done(value, err?);
    private _next(value);
    run(value: T): Promise<any>;
    use(middleware: TMiddleware<T>): Pipeline<T>;
}
