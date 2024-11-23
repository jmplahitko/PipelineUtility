export type NextOperator<T = any> = (value: T) => void;
export type Operator<T, E extends Error> = (value: T, next: NextOperator<T>, resolve: ResolvePipe<T>, reject: RejectPipe<E>) => void;
export type ResolvePipe<T> = (value: T | PromiseLike<T>) => void;
export type RejectPipe<E extends Error = Error> = (error: E) => void;
export declare function createPipe<T, E extends Error = Error>(operators: Iterable<Operator<T, E>>): (value: T) => Promise<T>;
