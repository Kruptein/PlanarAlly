import { subtractP, Vector } from "../../core/geometry";
import { SyncMode, InvalidationMode } from "../../core/models/types";
import { uuidv4 } from "../../core/utils";
import { getGameState } from "../../store/_game";
import { gameStore } from "../../store/game";
import { sendRemoveShapes } from "../api/emits/shape/core";
import { addGroupMembers, createNewGroupForShapes } from "../groups";
import { getGlobalId, getLocalId } from "../id";
import type { GlobalId } from "../id";
import type { IShape } from "../interfaces/shape";
import type { LayerName } from "../models/floor";
import type { ServerShape, ServerPolygon, ServerToggleComposite } from "../models/shapes";
import { addOperation } from "../operations/undo";
import { accessSystem } from "../systems/access";
import type { ServerShapeOwner } from "../systems/access/models";
import type { AuraId, ServerAura } from "../systems/auras/models";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { positionSystem } from "../systems/position";
import { getProperties } from "../systems/properties/state";
import { selectedSystem } from "../systems/selected";
import type { ServerTracker, TrackerId } from "../systems/trackers/models";
import { TriangulationTarget, VisibilityMode, visionState } from "../vision/state";

import { createShapeFromDict } from "./create";

export function copyShapes(): void {
    if (!selectedSystem.hasSelection) return;
    const clipboard: ServerShape[] = [];
    for (const shape of selectedSystem.get({ includeComposites: true })) {
        if (!accessSystem.hasAccessTo(shape.id, false, { edit: true })) continue;
        if (shape.groupId === undefined) {
            createNewGroupForShapes([shape.id]);
        }
        clipboard.push(shape.asDict());
    }
    gameStore.setClipboard(clipboard);
    gameStore.setClipboardPosition(positionSystem.screenCenter);
}

export function pasteShapes(targetLayer?: LayerName): readonly IShape[] {
    const layer = floorSystem.getLayer(floorState.currentFloor.value!, targetLayer);
    if (!layer) return [];
    const gameState = getGameState();
    if (gameState.clipboard.length === 0) return [];

    selectedSystem.clear();

    gameStore.setClipboardPosition(positionSystem.screenCenter);
    let offset = subtractP(positionSystem.screenCenter, gameState.clipboardPosition);
    // Check against 200 as that is the squared length of a vector with size 10, 10
    if (offset.squaredLength() < 200) {
        offset = new Vector(10, 10);
    }

    const shapeMap: Map<GlobalId, GlobalId> = new Map();
    const composites: ServerToggleComposite[] = [];
    const serverShapes: ServerShape[] = [];

    const groupShapes: Record<string, GlobalId[]> = {};

    for (const clip of gameState.clipboard) {
        const newShape: ServerShape = Object.assign({}, clip, { auras: [], labels: [], owners: [], trackers: [] });
        newShape.uuid = uuidv4();
        newShape.x = clip.x + offset.x;
        newShape.y = clip.y + offset.y;

        shapeMap.set(clip.uuid, newShape.uuid);

        if (clip.type_ === "polygon") {
            (newShape as ServerPolygon).vertices = (clip as ServerPolygon).vertices.map((p) => [
                p[0] + offset.x,
                p[1] + offset.y,
            ]);
        }

        // Trackers
        newShape.trackers = [];
        for (const tracker of clip.trackers) {
            const newTracker: ServerTracker = {
                ...tracker,
                uuid: uuidv4() as unknown as TrackerId,
            };
            newShape.trackers.push(newTracker);
        }

        // Auras
        newShape.auras = [];
        for (const aura of clip.auras) {
            const newAura: ServerAura = {
                ...aura,
                uuid: uuidv4() as unknown as AuraId,
            };
            newShape.auras.push(newAura);
        }

        // Owners
        newShape.owners = [];
        for (const owner of clip.owners) {
            const newOwner: ServerShapeOwner = {
                ...owner,
                shape: newShape.uuid,
            };
            newShape.owners.push(newOwner);
        }

        // Badge
        if (clip.group !== undefined) {
            // group join needs to happen after shape creation
            newShape.group = undefined;
            if (!(clip.group in groupShapes)) {
                groupShapes[clip.group] = [];
            }
            groupShapes[clip.group].push(newShape.uuid);
        }
        if (clip.type_ === "togglecomposite") {
            composites.push(newShape as ServerToggleComposite);
        } else {
            serverShapes.push(newShape);
        }
    }

    for (const composite of composites) {
        serverShapes.push({
            ...composite,
            active_variant: shapeMap.get(composite.active_variant)!,
            variants: composite.variants.map((v) => ({ ...v, uuid: shapeMap.get(v.uuid)! })),
        } as ServerToggleComposite); // make sure it's added after the regular shapes
    }

    // Finalize
    for (const serverShape of serverShapes) {
        const shape = createShapeFromDict(serverShape);
        if (shape === undefined) continue;

        layer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);

        if (!(shape.options.skipDraw ?? false)) {
            selectedSystem.push(shape.id);
        }
    }

    for (const [group, shapes] of Object.entries(groupShapes)) {
        addGroupMembers(
            group,
            shapes.map((uuid) => ({ uuid: getLocalId(uuid)! })),
            true,
        );
    }
    // const groupShape = groupShapes.find((s) => s.uuid === shape.uuid);
    //     if (groupShape !== undefined) {
    //         addGroupMembers(groupShape.group, [{ uuid: groupShape.uuid }], true);
    //     }

    layer.invalidate(false);
    return selectedSystem.get({ includeComposites: false });
}

export function deleteShapes(shapes: readonly IShape[], sync: SyncMode): void {
    if (sync === SyncMode.FULL_SYNC) {
        addOperation({ type: "shaperemove", shapes: shapes.map((s) => s.asDict()) });
    }

    const removed: GlobalId[] = [];
    const recalculateIterative = visionState.state.mode === VisibilityMode.TRIANGLE_ITERATIVE;
    let recalculateVision = false;
    let recalculateMovement = false;
    for (let i = shapes.length - 1; i >= 0; i--) {
        const sel = shapes[i];
        if (sync !== SyncMode.NO_SYNC && !accessSystem.hasAccessTo(sel.id, false, { edit: true })) continue;
        removed.push(getGlobalId(sel.id));
        const props = getProperties(sel.id)!;
        if (props.blocksVision) recalculateVision = true;
        if (props.blocksMovement) recalculateMovement = true;
        sel.layer.removeShape(sel, { sync: SyncMode.NO_SYNC, recalculate: recalculateIterative, dropShapeId: true });
    }
    if (sync !== SyncMode.NO_SYNC) sendRemoveShapes({ uuids: removed, temporary: sync === SyncMode.TEMP_SYNC });
    if (!recalculateIterative) {
        if (recalculateMovement)
            visionState.recalculate({ target: TriangulationTarget.MOVEMENT, floor: floorState.raw.floorIndex });
        if (recalculateVision)
            visionState.recalculate({ target: TriangulationTarget.VISION, floor: floorState.raw.floorIndex });
        floorSystem.invalidateVisibleFloors();
    }
}
