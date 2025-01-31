import { reactive } from "vue";
import type { DeepReadonly, UnwrapNestedRefs } from "vue";

// Given that we have a pure ts codebase
// we can work with readonly purely as typing
// and not bother with explicit readonly() calls

interface ReactiveState<T extends object, W extends string = ""> {
    raw: DeepReadonly<Omit<T, W>>;
    reactive: DeepReadonly<UnwrapNestedRefs<T>>;
    mutableReactive: UnwrapNestedRefs<T>;
}

export function buildState<T extends object, W extends string = "">(state: T): ReactiveState<T, W>;
export function buildState<T extends object, U, W extends string = "">(
    state: T,
    nonReactiveProperties: U,
): ReactiveState<T, W> & {
    readonly: DeepReadonly<U>;
    mutable: U;
};
export function buildState<T extends object, U = void, W extends string = "">(
    state: T,
    nonReactiveProperties?: U,
): ReactiveState<T, W> & {
    readonly: DeepReadonly<U>;
    mutable: U | undefined;
} {
    const reactiveState = reactive(state);
    return {
        readonly: nonReactiveProperties as DeepReadonly<U>,
        mutable: nonReactiveProperties,
        raw: state as unknown as DeepReadonly<Omit<T, W>>,
        reactive: reactiveState as DeepReadonly<UnwrapNestedRefs<T>>,
        mutableReactive: reactiveState,
    };
}
