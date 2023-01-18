import { InvalidationMode } from "../core/models/types";
import type { SyncMode } from "../core/models/types";
import type { SelectionBoxFunction } from "../core/plugins/modals/selectionBox";

import { sendFloorChange, sendLayerChange } from "./api/emits/shape/core";
import { getGlobalId } from "./id";
import type { ILayer } from "./interfaces/layer";
import type { IShape } from "./interfaces/shape";
import type { Floor } from "./models/floor";
import type { ServerShape } from "./models/shapes";
import { addOperation } from "./operations/undo";
import { createShapeFromDict } from "./shapes/create";
import { floorSystem } from "./systems/floors";
import { getProperties } from "./systems/properties/state";
import { visionState } from "./vision/state";

export function moveFloor(shapes: IShape[], newFloor: Floor, sync: boolean): void {
    shapes = shapes.filter((s) => !getProperties(s.id)!.isLocked);
    if (shapes.length === 0) return;
    const firstShape = shapes[0]!;
    const oldLayer = firstShape.layer;
    const oldFloor = firstShape.floor;
    if (shapes.some((s) => s.layer !== oldLayer)) {
        throw new Error("Mixing shapes from different floors in shape move");
    }

    const newLayer = floorSystem.getLayer(newFloor, oldLayer.name)!;
    for (const shape of shapes) {
        visionState.moveShape(shape.id, oldFloor.id, newFloor.id);
        shape.setLayer(newFloor.id, oldLayer.name);
    }
    oldLayer.setShapes(...oldLayer.getShapes({ includeComposites: true }).filter((s) => !shapes.includes(s)));
    newLayer.pushShapes(...shapes);
    oldLayer.invalidate(false);
    newLayer.invalidate(false);
    if (sync) {
        const uuids = shapes.map((s) => s.id);
        sendFloorChange({ uuids: shapes.map((s) => getGlobalId(s.id)!), floor: newFloor.name });
        addOperation({ type: "floormovement", shapes: uuids, from: oldFloor.id, to: newFloor.id });
    }
}

export function moveLayer(shapes: readonly IShape[], newLayer: ILayer, sync: boolean): void {
    if (shapes.length === 0) return;
    const oldLayer = shapes[0]!.layer;

    if (shapes.some((s) => s.layer !== oldLayer)) {
        throw new Error("Mixing shapes from different floors in shape move");
    }

    for (const shape of shapes) shape.setLayer(newLayer.floor, newLayer.name);
    // Update layer shapes
    oldLayer.setShapes(...oldLayer.getShapes({ includeComposites: true }).filter((s) => !shapes.includes(s)));
    newLayer.pushShapes(...shapes);
    // Revalidate layers  (light should at most be redone once)
    oldLayer.invalidate(true);
    newLayer.invalidate(false);
    // Sync!
    if (sync) {
        const uuids = shapes.map((s) => s.id);
        sendLayerChange({
            uuids: shapes.map((s) => getGlobalId(s.id)!),
            layer: newLayer.name,
            floor: floorSystem.getFloor({ id: newLayer.floor })!.name,
        });
        addOperation({ type: "layermovement", shapes: uuids, from: oldLayer.name, to: newLayer.name });
    }
}

export function addShape(shape: ServerShape, sync: SyncMode): IShape | undefined {
    if (!floorSystem.hasLayer(floorSystem.getFloor({ name: shape.floor })!, shape.layer)) {
        console.log(`Shape with unknown layer ${shape.layer} could not be added`);
        return;
    }
    const layer = floorSystem.getLayer(floorSystem.getFloor({ name: shape.floor })!, shape.layer)!;
    const sh = createShapeFromDict(shape);
    if (sh === undefined) {
        console.log(`Shape with unknown type ${shape.type_} could not be added`);
        return;
    }
    layer.addShape(sh, sync, InvalidationMode.NORMAL);
    layer.invalidate(false);
    return sh;
}

export let selectionBoxFunction: SelectionBoxFunction | undefined = undefined;

export function setSelectionBoxFunction(f: SelectionBoxFunction): void {
    selectionBoxFunction = f;
}
