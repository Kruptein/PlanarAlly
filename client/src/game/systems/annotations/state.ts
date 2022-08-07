import type { LocalId } from "../../id";
import { buildState } from "../state";

interface ReactiveAnnotationState {
    id: LocalId | undefined;
    annotation: string | undefined;
    annotationVisible: boolean;
}

interface AnnotationState {
    annotations: Map<LocalId, string>;
    visible: Set<LocalId>;
}

const state = buildState<ReactiveAnnotationState, AnnotationState>(
    {
        id: undefined,
        annotation: undefined,
        annotationVisible: false,
    },
    { annotations: new Map(), visible: new Set() },
);

function get(id: LocalId): { annotation: string; annotationVisible: boolean } {
    return {
        annotation: state.readonly.annotations.get(id) ?? "",
        annotationVisible: state.readonly.visible.has(id),
    };
}

export const annotationState = {
    ...state,
    get,
};
