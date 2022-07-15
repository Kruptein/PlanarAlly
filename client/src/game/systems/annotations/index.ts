import { registerSystem } from "..";
import type { ShapeSystem } from "..";
import type { Sync } from "../../../core/models/types";
import { sendShapeSetAnnotation, sendShapeSetAnnotationVisible } from "../../api/emits/shape/options";
import { getGlobalId } from "../../id";
import type { LocalId } from "../../id";

import { annotationState } from "./state";

const { _$, _ } = annotationState;

export class AnnotationSystem implements ShapeSystem {
    // BEHAVIOUR

    clear(): void {
        _$.id = undefined;
        _.visible.clear();
        _.annotations.clear();
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, data: { annotation: string; annotationVisible: boolean }): void {
        if (data.annotationVisible) _.visible.add(id);
        if (data.annotation !== "") _.annotations.set(id, data.annotation);
    }

    drop(id: LocalId): void {
        _.visible.delete(id);
        _.annotations.delete(id);
        if (_$.id === id) {
            _$.id = undefined;
        }
    }

    loadState(id: LocalId): void {
        _$.id = id;
        _$.annotation = _.annotations.get(id) ?? "";
        _$.annotationVisible = _.visible.has(id);
    }

    dropState(): void {
        _$.id = undefined;
        _$.annotation = undefined;
        _$.annotationVisible = false;
    }

    setAnnotation(id: LocalId, annotation: string, syncTo: Sync): void {
        if (annotation === "") _.annotations.delete(id);
        else _.annotations.set(id, annotation);

        if (syncTo.server) sendShapeSetAnnotation({ shape: getGlobalId(id), value: annotation });
        if (_$.id === id) _$.annotation = annotation;
    }

    setAnnotationVisible(id: LocalId, annotationVisible: boolean, syncTo: Sync): void {
        if (annotationVisible) _.visible.add(id);
        else _.visible.delete(id);

        if (syncTo.server) sendShapeSetAnnotationVisible({ shape: getGlobalId(id), value: annotationVisible });
        if (_$.id === id) _$.annotationVisible = annotationVisible;
    }
}

export const annotationSystem = new AnnotationSystem();
registerSystem("annotations", annotationSystem, true, annotationState);
