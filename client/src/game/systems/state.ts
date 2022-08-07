import { reactive } from "vue";
import type { DeepReadonly, UnwrapNestedRefs } from "vue";

// Given that we have a pure ts codebase
// we can work with readonly purely as typing
// and not bother with explicit readonly() calls

interface ReactiveState<T extends object> {
    raw: DeepReadonly<T>;
    reactive: DeepReadonly<UnwrapNestedRefs<T>>;
    mutableReactive: UnwrapNestedRefs<T>;
}

export function buildState<T extends object>(state: T): ReactiveState<T>;
export function buildState<T extends object, U>(
    state: T,
    nonReactiveProperties: U,
): ReactiveState<T> & {
    readonly: DeepReadonly<U>;
    mutable: U;
};
export function buildState<T extends object, U = void>(
    state: T,
    nonReactiveProperties?: U,
): ReactiveState<T> & {
    readonly: DeepReadonly<U>;
    mutable: U | undefined;
} {
    const reactiveState = reactive(state);
    return {
        readonly: nonReactiveProperties as DeepReadonly<U>,
        mutable: nonReactiveProperties,
        raw: state as DeepReadonly<T>,
        reactive: reactiveState as DeepReadonly<UnwrapNestedRefs<T>>,
        mutableReactive: reactiveState,
    };
}
