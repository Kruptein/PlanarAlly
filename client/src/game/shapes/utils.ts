import type {
    ApiAura,
    ApiPolygonShape,
    ApiShape,
    ApiShapeOwner,
    ApiToggleCompositeShape,
    ApiTracker,
} from "../../apiTypes";
import { subtractP, Vector } from "../../core/geometry";
import type { GlobalId } from "../../core/id";
import { SyncMode, InvalidationMode } from "../../core/models/types";
import { uuidv4 } from "../../core/utils";
import { sendRemoveShapes } from "../api/emits/shape/core";
import { getGlobalId, getLocalId } from "../id";
import type { IShape } from "../interfaces/shape";
import type { LayerName } from "../models/floor";
import { addOperation } from "../operations/undo";
import { accessSystem } from "../systems/access";
import type { AuraId } from "../systems/auras/models";
import { clipboardSystem } from "../systems/clipboard";
import { clipboardState } from "../systems/clipboard/state";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { groupSystem } from "../systems/groups";
import { positionSystem } from "../systems/position";
import { getProperties } from "../systems/properties/state";
import { VisionBlock } from "../systems/properties/types";
import { selectedSystem } from "../systems/selected";
import type { TrackerId } from "../systems/trackers/models";
import { TriangulationTarget, VisibilityMode, visionState } from "../vision/state";

import { createShapeFromDict } from "./create";

export function copyShapes(): void {
    if (!selectedSystem.hasSelection) return;
    const clipboard: ApiShape[] = [];
    for (const shape of selectedSystem.get({ includeComposites: true })) {
        if (!accessSystem.hasAccessTo(shape.id, false, { edit: true })) continue;
        if (groupSystem.getGroupId(shape.id) === undefined) {
            groupSystem.createNewGroupForShapes([shape.id]);
        }
        clipboard.push(shape.asDict());
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
    const composites: ApiToggleCompositeShape[] = [];
    const serverShapes: ApiShape[] = [];

    const groupShapes: Record<string, GlobalId[]> = {};

    for (const clip of clipboardState.mutableReactive.clipboard) {
        const newShape: ApiShape = Object.assign({}, clip, {
            auras: [],
            owners: [],
            trackers: [],
        });
        newShape.uuid = uuidv4();
        newShape.x = clip.x + offset.x;
        newShape.y = clip.y + offset.y;

        shapeMap.set(clip.uuid, newShape.uuid);

        if (clip.type_ === "polygon") {
            const polygon = clip as ApiPolygonShape;
            const vertices = JSON.parse(polygon.vertices) as [number, number][];
            (newShape as ApiPolygonShape).vertices = JSON.stringify(
                vertices.map((p) => [p[0] + offset.x, p[1] + offset.y]),
            );
        }

        // Trackers
        newShape.trackers = [];
        for (const tracker of clip.trackers) {
            const newTracker: ApiTracker = {
                ...tracker,
                uuid: uuidv4() as unknown as TrackerId,
            };
            newShape.trackers.push(newTracker);
        }

        // Auras
        newShape.auras = [];
        for (const aura of clip.auras) {
            const newAura: ApiAura = {
                ...aura,
                uuid: uuidv4() as unknown as AuraId,
            };
            newShape.auras.push(newAura);
        }

        // Owners
        newShape.owners = [];
        for (const owner of clip.owners) {
            const newOwner: ApiShapeOwner = {
                ...owner,
                shape: newShape.uuid,
            };
            newShape.owners.push(newOwner);
        }

        // Badge
        if (clip.group !== null) {
            // group join needs to happen after shape creation
            newShape.group = null;
            if (!(clip.group in groupShapes)) {
                groupShapes[clip.group] = [];
            }
            groupShapes[clip.group]!.push(newShape.uuid);
        }
        if (clip.type_ === "togglecomposite") {
            composites.push(newShape as ApiToggleCompositeShape);
        } else {
            serverShapes.push(newShape);
        }
    }

    for (const composite of composites) {
        if (composite.active_variant === null) continue;
        serverShapes.push({
            ...composite,
            active_variant: shapeMap.get(composite.active_variant)!,
            variants: composite.variants.map((v) => ({ ...v, uuid: shapeMap.get(v.uuid)! })),
        } as ApiToggleCompositeShape); // make sure it's added after the regular shapes
    }

    // Finalize
    for (const serverShape of serverShapes) {
        const shape = createShapeFromDict(serverShape, layer.floor, layer.name);
        if (shape === undefined) continue;

        layer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);

        if (!(shape.options.skipDraw ?? false)) {
            selectedSystem.push(shape.id);
        }
    }

    for (const [group, shapes] of Object.entries(groupShapes)) {
        groupSystem.addGroupMembers(
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
    if (shapes.length === 0) return;
    if (sync === SyncMode.FULL_SYNC) {
        addOperation({
            type: "shaperemove",
            shapes: shapes.map((s) => s.asDict()),
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
        if (sync !== SyncMode.NO_SYNC && !accessSystem.hasAccessTo(sel.id, false, { edit: true })) continue;
        const gId = getGlobalId(sel.id);
        if (gId) {
            removed.push(gId);
        }
        const props = getProperties(sel.id)!;
        if (props.blocksVision !== VisionBlock.No) recalculateVision = true;
        if (props.blocksMovement) recalculateMovement = true;

        sel.layer?.removeShape(sel, { sync: SyncMode.NO_SYNC, recalculate: recalculateIterative, dropShapeId: true });
    }
    if (sync !== SyncMode.NO_SYNC) sendRemoveShapes({ uuids: removed, temporary: sync === SyncMode.TEMP_SYNC });
    if (!recalculateIterative) {
        const floor = shapes[0]?.floorId;
        if (floor !== undefined) {
            if (recalculateMovement) visionState.recalculate({ target: TriangulationTarget.MOVEMENT, floor });
            if (recalculateVision) visionState.recalculate({ target: TriangulationTarget.VISION, floor });
            floorSystem.invalidateVisibleFloors();
        }
    }
}
