// Logic to handle collapse/expand of selection

import { Vector } from "../../../core/geometry";
import { SyncMode } from "../../../core/models/types";
import { calculateDelta } from "../../drag";
import { getShape } from "../../id";
import type { IShape } from "../../interfaces/shape";
import { moveShapes } from "../../operations/movement";

import { selectedState } from "./state";

import { selectedSystem } from ".";

export function collapseSelection(): void {
    const shapes = selectedSystem.get({ includeComposites: false });
    if (shapes.length <= 1) return;

    const focus = selectedState.raw.focus!;
    const focusShape = getShape(focus);
    if (focusShape === undefined) return;

    selectedSystem.set(focus);
    focusShape.options.collapsedIds = [];
    const center = focusShape.center;

    const layer = focusShape.layer!;
    layer.moveShapeOrder(
        focusShape,
        layer.size({ includeComposites: true, onlyInView: false }) - 1,
        SyncMode.FULL_SYNC,
    );

    for (const shape of shapes) {
        if (shape.id === focus) {
            continue;
        } else {
            focusShape.options.collapsedIds.push([shape.id, Vector.fromPoints(focusShape.center, shape.center)]);
            shape.center = center;
        }
    }

    focusShape.invalidate(false);
}

// UpdateList can optionally be passed to update an ongoing list of shapes to be updated
// e.g. for server synchronization
export async function expandSelection(updateList?: IShape[]): Promise<void> {
    const focus = selectedState.raw.focus;
    if (focus === undefined) return;

    const shape = getShape(focus);
    if (shape === undefined || shape.options.collapsedIds === undefined) return;

    for (const [collapsedId, vector] of shape.options.collapsedIds) {
        const collapsedShape = getShape(collapsedId);
        if (collapsedShape !== undefined) {
            await moveShapes([collapsedShape], calculateDelta(vector, collapsedShape, true), true);
            selectedSystem.push(collapsedShape.id);
            if (updateList && !collapsedShape.preventSync) updateList.push(collapsedShape);
        }
    }

    shape.options.collapsedIds = undefined;

    shape.invalidate(false);
}
