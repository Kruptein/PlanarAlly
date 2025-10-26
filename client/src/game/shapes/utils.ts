import { addP, subtractP, Vector } from "../../core/geometry";
import type { GlobalId } from "../../core/id";
import { SyncMode, InvalidationMode } from "../../core/models/types";
import { sendRemoveShapes } from "../api/emits/shape/core";
import { getGlobalId } from "../id";
import type { IShape } from "../interfaces/shape";
import type { LayerName } from "../models/floor";
import { addOperation } from "../operations/undo";
import { accessSystem } from "../systems/access";
import { clipboardSystem } from "../systems/clipboard";
import { clipboardState } from "../systems/clipboard/state";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { groupSystem } from "../systems/groups";
import { positionSystem } from "../systems/position";
import { getProperties } from "../systems/properties/state";
import { VisionBlock } from "../systems/properties/types";
import { selectedSystem } from "../systems/selected";
import { TriangulationTarget, VisibilityMode, visionState } from "../vision/state";

import type { FullCompactForm } from "./transformations";
import { fromSystemForm, instantiateCompactForm } from "./transformations";

export function copyShapes(): void {
    if (!selectedSystem.hasSelection) return;
    const clipboard: FullCompactForm[] = [];
    for (const shape of selectedSystem.get({ includeComposites: true })) {
        if (!accessSystem.hasAccessTo(shape.id, "edit")) continue;
        // todo: check if we can delay this to the paste phase, to prevent over-eager group creation
        if (groupSystem.getGroupId(shape.id) === undefined) {
            groupSystem.createNewGroupForShapes([shape.id]);
        }
        clipboard.push(fromSystemForm(shape.id));
    }
    clipboardSystem.setClipboard(clipboard);
    clipboardSystem.setClipboardPosition(positionSystem.screenCenter);
}

export function pasteShapes(targetLayer?: LayerName): readonly IShape[] {
    const layer = floorSystem.getLayer(floorState.currentFloor.value!, targetLayer);
    if (!layer) return [];

    if (clipboardState.raw.clipboard.length === 0) return [];

    selectedSystem.clear();

    clipboardSystem.setClipboardPosition(positionSystem.screenCenter);
    let offset = subtractP(positionSystem.screenCenter, clipboardState.raw.clipboardPosition);
    // Check against 200 as that is the squared length of a vector with size 10, 10
    if (offset.squaredLength() < 200) {
        offset = new Vector(10, 10);
    }

    const shapeMap = new Map<GlobalId, GlobalId>();
    const compactShapes = clipboardState.raw.clipboard as FullCompactForm[];

    for (const clip of compactShapes.sort((a, b) =>
        a.core.type_ === b.core.type_ ? 0 : a.core.type_ === "togglecomposite" ? 1 : -1,
    )) {
        const newShape = instantiateCompactForm(
            clip,
            "duplicate",
            (shape) => {
                shape.refPoint = addP(shape.refPoint, offset);
                layer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);
            },
            shapeMap,
        );
        if (newShape === undefined) continue;

        shapeMap.set(clip.core.uuid, getGlobalId(newShape.id)!);

        if (!(newShape.options.skipDraw ?? false)) {
            selectedSystem.push(newShape.id);
        }
    }

    layer.invalidate(false);
    return selectedSystem.get({ includeComposites: false });
}

export function deleteShapes(shapes: readonly IShape[], sync: SyncMode, invalidateVision = true): void {
    if (shapes.length === 0) return;
    if (sync === SyncMode.FULL_SYNC) {
        addOperation({
            type: "shaperemove",
            shapes: shapes.map((s) => fromSystemForm(s.id)),
            floor: shapes[0]!.floor!.name,
            layerName: shapes[0]!.layer!.name,
        });
    }

    const removed: GlobalId[] = [];
    const recalculateIterative = visionState.state.mode === VisibilityMode.TRIANGLE_ITERATIVE;
    let recalculateVision = false;
    let recalculateMovement = false;
    for (let i = shapes.length - 1; i >= 0; i--) {
        const sel = shapes[i]!;
        // Temp sync access is less strict as these shapes are short-lived
        // and usually small UI helpers that a player shouldn't have any real access to
        if (sync === SyncMode.FULL_SYNC && !accessSystem.hasAccessTo(sel.id, "edit")) continue;
        const gId = getGlobalId(sel.id);
        if (gId) {
            removed.push(gId);
        }
        if (invalidateVision) {
            const props = getProperties(sel.id)!;
            if (props.blocksVision !== VisionBlock.No) recalculateVision = true;
            if (props.blocksMovement) recalculateMovement = true;
        }

        sel.layer?.removeShape(sel, { sync: SyncMode.NO_SYNC, recalculate: recalculateIterative, dropShapeId: true });
    }
    if (sync !== SyncMode.NO_SYNC) sendRemoveShapes({ uuids: removed, temporary: sync === SyncMode.TEMP_SYNC });
    if (invalidateVision && !recalculateIterative) {
        const floor = shapes[0]?.floorId;
        if (floor !== undefined) {
            if (recalculateMovement) visionState.recalculate({ target: TriangulationTarget.MOVEMENT, floor });
            if (recalculateVision) visionState.recalculate({ target: TriangulationTarget.VISION, floor });
            floorSystem.invalidateVisibleFloors();
        }
    }
}
