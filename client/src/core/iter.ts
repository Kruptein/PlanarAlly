// A set of helpers to deal with iterables
// until TC39 iterator helpers (https://github.com/tc39/proposal-iterator-helpers/tree/main) is stable

// Code is either taken literally or heavily inspired on the itertool.js project
// https://github.com/nvie/itertools.js

type Predicate<T> = (arg0: T) => boolean;

export function* filter<T>(iterable: Iterable<T>, predicate: Predicate<T>): Iterable<T> {
    for (const value of iterable) {
        if (predicate(value)) {
            yield value;
        }
    }
}

export function* guard<T, Y extends T>(iterable: Iterable<T>, guard: (a: T) => a is Y): Iterable<Y> {
    for (const value of iterable) {
        if (guard(value)) {
            yield value;
        }
    }
}

export function defined<T>(x: T | undefined): x is T {
    return x !== undefined;
}

export function* map<T, V>(iterable: Iterable<T>, mapper: (arg0: T) => V): Iterable<V> {
    for (const value of iterable) {
        yield mapper(value);
    }
}

// eslint-disable-next-line import/no-unused-modules
export function some<T>(iterable: Iterable<T>, mapper: (arg0: T) => boolean): boolean {
    for (const value of iterable) {
        if (mapper(value)) return true;
    }
    return false;
}

export function find<T>(iterable: Iterable<T>, mapper: (arg0: T) => boolean): T | undefined {
    for (const value of iterable) {
        if (mapper(value)) return value;
    }
}
