import { registerSystem } from "..";
import type { ShapeSystem } from "..";
import type { Sync } from "../../../core/models/types";
import { sendShapeSetAnnotation, sendShapeSetAnnotationVisible } from "../../api/emits/shape/options";
import { getGlobalId } from "../../id";
import type { LocalId } from "../../id";

import { annotationState } from "./state";

const { mutableReactive: $, mutable, readonly } = annotationState;

class AnnotationSystem implements ShapeSystem {
    // BEHAVIOUR

    clear(): void {
        $.id = undefined;
        mutable.visible.clear();
        mutable.annotations.clear();
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, data: { annotation: string; annotationVisible: boolean }): void {
        if (data.annotationVisible) mutable.visible.add(id);
        if (data.annotation !== "") mutable.annotations.set(id, data.annotation);
    }

    drop(id: LocalId): void {
        mutable.visible.delete(id);
        mutable.annotations.delete(id);
        if ($.id === id) {
            $.id = undefined;
        }
    }

    loadState(id: LocalId): void {
        $.id = id;
        $.annotation = readonly.annotations.get(id) ?? "";
        $.annotationVisible = readonly.visible.has(id);
    }

    dropState(): void {
        $.id = undefined;
        $.annotation = undefined;
        $.annotationVisible = false;
    }

    setAnnotation(id: LocalId, annotation: string, syncTo: Sync): void {
        if (annotation === "") mutable.annotations.delete(id);
        else mutable.annotations.set(id, annotation);

        if (syncTo.server) {
            const gId = getGlobalId(id);
            if (gId !== undefined) sendShapeSetAnnotation({ shape: gId, value: annotation });
        }
        if ($.id === id) $.annotation = annotation;
    }

    setAnnotationVisible(id: LocalId, annotationVisible: boolean, syncTo: Sync): void {
        if (annotationVisible) mutable.visible.add(id);
        else mutable.visible.delete(id);

        if (syncTo.server) {
            const gId = getGlobalId(id);
            if (gId !== undefined) sendShapeSetAnnotationVisible({ shape: gId, value: annotationVisible });
        }
        if ($.id === id) $.annotationVisible = annotationVisible;
    }
}

export const annotationSystem = new AnnotationSystem();
registerSystem("annotations", annotationSystem, true, annotationState);
