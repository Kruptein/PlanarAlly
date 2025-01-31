import type {
    ApiShapeWithLayerInfo,
    ShapeCircleSizeUpdate,
    ShapeFloorChange,
    ShapeLayerChange,
    ShapeOrder,
    ShapePositionUpdate,
    ShapeRectSizeUpdate,
} from "../../../../apiTypes";
import type { GlobalId } from "../../../../core/id";
import { SyncMode } from "../../../../core/models/types";
import { activeShapeStore } from "../../../../store/activeShape";
import { getLocalId, getShapeFromGlobal } from "../../../id";
import type { ICircle } from "../../../interfaces/shapes/circle";
import type { IRect } from "../../../interfaces/shapes/rect";
import { deleteShapes } from "../../../shapes/utils";
import { accessSystem } from "../../../systems/access";
import { floorSystem } from "../../../systems/floors";
import { selectedSystem } from "../../../systems/selected";
import { addShape, moveFloor, moveLayer } from "../../../temp";
import { initiativeStore } from "../../../ui/initiative/state";
import { socket } from "../../socket";

socket.on("Shape.Set", (data: ApiShapeWithLayerInfo) => {
    const { shape: apiShape, layer, floor } = data;
    // hard reset a shape
    const uuid = apiShape.uuid;
    const old = getShapeFromGlobal(uuid);
    const isActive = activeShapeStore.state.id === getLocalId(uuid);
    const hasEditDialogOpen = isActive && activeShapeStore.state.showEditDialog;
    let deps = undefined;
    if (old) {
        deps = old.dependentShapes;
        old.removeDependentShapes({ dropShapeId: false });
        old.layer?.removeShape(old, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
    }
    const shape = addShape(apiShape, floor, layer, SyncMode.NO_SYNC, deps);

    if (shape && isActive) {
        selectedSystem.push(shape.id);
        activeShapeStore.setActiveShape(shape);
        if (hasEditDialogOpen) activeShapeStore.setShowEditDialog(true);
    }
});

socket.on("Shape.Add", (data: ApiShapeWithLayerInfo) => {
    addShape(data.shape, data.floor, data.layer, SyncMode.NO_SYNC);
    initiativeStore._forceUpdate();
});

socket.on("Shapes.Add", (shapes: ApiShapeWithLayerInfo[]) => {
    for (const data of shapes) {
        addShape(data.shape, data.floor, data.layer, SyncMode.NO_SYNC);
    }
    initiativeStore._forceUpdate();
});

socket.on("Shapes.Remove", (shapeIds: GlobalId[]) => {
    const shapes = shapeIds.map((s) => getShapeFromGlobal(s)!).filter((s) => s !== undefined);
    deleteShapes(shapes, SyncMode.NO_SYNC);
    initiativeStore._forceUpdate();
});

socket.on("Shapes.Position.Update", (data: ShapePositionUpdate[]) => {
    for (const sh of data) {
        const shape = getShapeFromGlobal(sh.uuid);
        if (shape === undefined) {
            continue;
        }
        shape.setPositionRepresentation(sh.position);
    }
});

socket.on("Shape.Order.Set", (data: ShapeOrder) => {
    const shape = getShapeFromGlobal(data.uuid);
    if (shape === undefined) {
        console.log(`Attempted to move the shape order of an unknown shape`);
        return;
    }
    shape.layer?.moveShapeOrder(shape, data.index, SyncMode.NO_SYNC);
});

socket.on("Shapes.Floor.Change", (data: ShapeFloorChange) => {
    const shapes = data.uuids.map((u) => getShapeFromGlobal(u) ?? undefined).filter((s) => s !== undefined);
    if (shapes.length === 0) return;
    moveFloor(shapes, floorSystem.getFloor({ name: data.floor })!, false);
    if (shapes.some((s) => accessSystem.hasAccessTo(s.id, false, { edit: true }))) {
        floorSystem.selectFloor({ name: data.floor }, false);
    }
});

socket.on("Shapes.Layer.Change", (data: ShapeLayerChange) => {
    const shapes = data.uuids.map((u) => getShapeFromGlobal(u) ?? undefined).filter((s) => s !== undefined);
    if (shapes.length === 0) return;
    moveLayer(shapes, floorSystem.getLayer(floorSystem.getFloor({ name: data.floor })!, data.layer)!, false);
});

socket.on("Shape.Rect.Size.Update", (data: ShapeRectSizeUpdate) => {
    const shape = getShapeFromGlobal(data.uuid) as IRect | undefined;
    if (shape === undefined) return;

    shape.w = data.w;
    shape.h = data.h;
    shape.layer?.invalidate(!shape.triggersVisionRecalc);
});

socket.on("Shape.Circle.Size.Update", (data: ShapeCircleSizeUpdate) => {
    const shape = getShapeFromGlobal(data.uuid) as ICircle | undefined;
    if (shape === undefined) return;

    shape.r = data.r;
    shape.layer?.invalidate(!shape.triggersVisionRecalc);
});
