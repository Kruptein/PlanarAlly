import { registerSystem } from "..";
import type { ShapeSystem } from "..";
import type { Sync } from "../../../core/models/types";
import { sendShapeSetAnnotation, sendShapeSetAnnotationVisible } from "../../api/emits/shape/options";
import { getGlobalId } from "../../id";
import type { LocalId } from "../../id";

import { annotationState } from "./state";

const { mutableReactive: $ } = annotationState;

export class AnnotationSystem implements ShapeSystem {
    // BEHAVIOUR

    clear(): void {
        $.id = undefined;
        $.visible.clear();
        $.annotations.clear();
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, data: { annotation: string; annotationVisible: boolean }): void {
        if (data.annotationVisible) $.visible.add(id);
        if (data.annotation !== "") $.annotations.set(id, data.annotation);
    }

    drop(id: LocalId): void {
        $.visible.delete(id);
        $.annotations.delete(id);
        if ($.id === id) {
            $.id = undefined;
        }
    }

    loadState(id: LocalId): void {
        $.id = id;
        $.annotation = $.annotations.get(id) ?? "";
        $.annotationVisible = $.visible.has(id);
    }

    dropState(): void {
        $.id = undefined;
        $.annotation = undefined;
        $.annotationVisible = false;
    }

    setAnnotation(id: LocalId, annotation: string, syncTo: Sync): void {
        if (annotation === "") $.annotations.delete(id);
        else $.annotations.set(id, annotation);

        if (syncTo.server) sendShapeSetAnnotation({ shape: getGlobalId(id), value: annotation });
        if ($.id === id) $.annotation = annotation;
    }

    setAnnotationVisible(id: LocalId, annotationVisible: boolean, syncTo: Sync): void {
        if (annotationVisible) $.visible.add(id);
        else $.visible.delete(id);

        if (syncTo.server) sendShapeSetAnnotationVisible({ shape: getGlobalId(id), value: annotationVisible });
        if ($.id === id) $.annotationVisible = annotationVisible;
    }
}

export const annotationSystem = new AnnotationSystem();
registerSystem("annotations", annotationSystem, true, annotationState);
