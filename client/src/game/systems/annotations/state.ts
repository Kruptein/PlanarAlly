import { reactive, readonly } from "vue";

import type { LocalId } from "../../id";

interface ReactiveAnnotationState {
    id: LocalId | undefined;
    annotation: string | undefined;
    annotationVisible: boolean;
}

const reactiveState = reactive<ReactiveAnnotationState>({
    id: undefined,
    annotation: undefined,
    annotationVisible: false,
});

interface AnnotationState {
    annotations: Map<LocalId, string>;
    visible: Set<LocalId>;
}

const state: AnnotationState = {
    annotations: new Map(),
    visible: new Set(),
};

function get(id: LocalId): { annotation: string; annotationVisible: boolean } {
    return {
        annotation: state.annotations.get(id) ?? "",
        annotationVisible: state.visible.has(id),
    };
}

export const annotationState = {
    $: readonly(reactiveState),
    _$: reactiveState,
    _: state,
    get,
};
