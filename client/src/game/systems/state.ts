import { reactive } from "vue";
import type { DeepReadonly, UnwrapNestedRefs } from "vue";

// Given that we have a pure ts codebase
// we can work with readonly purely as typing
// and not bother with explicit readonly() calls

export function buildState<T extends object>(
    state: T,
): {
    readonly: DeepReadonly<T>;
    reactive: DeepReadonly<UnwrapNestedRefs<T>>;
    mutableReactive: UnwrapNestedRefs<T>;
};
export function buildState<T extends object, U>(
    state: T,
    nonReactiveProperties: U,
): {
    readonly: DeepReadonly<T & U>;
    mutable: U;
    reactive: DeepReadonly<UnwrapNestedRefs<T>>;
    mutableReactive: UnwrapNestedRefs<T>;
};
export function buildState<T extends object, U = void>(
    state: T,
    nonReactiveProperties?: U,
): {
    readonly: DeepReadonly<T & U>;
    mutable: U | undefined;
    reactive: DeepReadonly<UnwrapNestedRefs<T>>;
    mutableReactive: UnwrapNestedRefs<T>;
} {
    const fullState = { ...state, ...nonReactiveProperties };
    const reactiveState = reactive(fullState);
    return {
        readonly: fullState as DeepReadonly<T & U>,
        mutable: fullState as unknown as U,
        reactive: reactiveState as DeepReadonly<UnwrapNestedRefs<T>>,
        mutableReactive: reactiveState,
    };
}
