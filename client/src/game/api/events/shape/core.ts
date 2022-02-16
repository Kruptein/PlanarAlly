import { SyncMode } from "../../../../core/models/types";
import { floorStore } from "../../../../store/floor";
import { getShapeFromGlobal } from "../../../id";
import type { GlobalId } from "../../../id";
import type { LayerName } from "../../../models/floor";
import type { ServerShape } from "../../../models/shapes";
import type { IShape } from "../../../shapes/interfaces";
import { deleteShapes } from "../../../shapes/utils";
import type { Circle } from "../../../shapes/variants/circle";
import type { Rect } from "../../../shapes/variants/rect";
import { addShape, moveFloor, moveLayer } from "../../../temp";
import { socket } from "../../socket";

socket.on("Shape.Set", (data: ServerShape) => {
    // hard reset a shape
    const old = getShapeFromGlobal(data.uuid);
    if (old) old.layer.removeShape(old, SyncMode.NO_SYNC, true);
    addShape(data, SyncMode.NO_SYNC);
});

socket.on("Shape.Add", (shape: ServerShape) => {
    addShape(shape, SyncMode.NO_SYNC);
});

socket.on("Shapes.Add", (shapes: ServerShape[]) => {
    for (const shape of shapes) {
        addShape(shape, SyncMode.NO_SYNC);
    }
});

socket.on("Shapes.Remove", (shapeIds: GlobalId[]) => {
    const shapes = shapeIds.map((s) => getShapeFromGlobal(s)!).filter((s) => s !== undefined);
    deleteShapes(shapes, SyncMode.NO_SYNC);
});

socket.on(
    "Shapes.Position.Update",
    (data: { uuid: GlobalId; position: { angle: number; points: [number, number][] } }[]) => {
        for (const sh of data) {
            const shape = getShapeFromGlobal(sh.uuid);
            if (shape === undefined) {
                continue;
            }
            shape.setPositionRepresentation(sh.position);
        }
    },
);

socket.on("Shape.Order.Set", (data: { uuid: GlobalId; index: number }) => {
    const shape = getShapeFromGlobal(data.uuid);
    if (shape === undefined) {
        console.log(`Attempted to move the shape order of an unknown shape`);
        return;
    }
    shape.layer.moveShapeOrder(shape, data.index, SyncMode.NO_SYNC);
});

socket.on("Shapes.Floor.Change", (data: { uuids: GlobalId[]; floor: string }) => {
    const shapes = data.uuids.map((u) => getShapeFromGlobal(u) ?? undefined).filter((s) => s !== undefined) as IShape[];
    if (shapes.length === 0) return;
    moveFloor(shapes, floorStore.getFloor({ name: data.floor })!, false);
    if (shapes.some((s) => s.ownedBy(false, { editAccess: true }))) floorStore.selectFloor({ name: data.floor }, false);
});

socket.on("Shapes.Layer.Change", (data: { uuids: GlobalId[]; floor: string; layer: LayerName }) => {
    const shapes = data.uuids.map((u) => getShapeFromGlobal(u) ?? undefined).filter((s) => s !== undefined) as IShape[];
    if (shapes.length === 0) return;
    moveLayer(shapes, floorStore.getLayer(floorStore.getFloor({ name: data.floor })!, data.layer)!, false);
});

socket.on("Shape.Rect.Size.Update", (data: { uuid: GlobalId; w: number; h: number }) => {
    const shape = getShapeFromGlobal(data.uuid) as Rect | undefined;
    if (shape === undefined) return;

    shape.w = data.w;
    shape.h = data.h;
    shape.layer.invalidate(!shape.triggersVisionRecalc);
});

socket.on("Shape.Circle.Size.Update", (data: { uuid: GlobalId; r: number }) => {
    const shape = getShapeFromGlobal(data.uuid) as Circle | undefined;
    if (shape === undefined) return;

    shape.r = data.r;
    shape.layer.invalidate(!shape.triggersVisionRecalc);
});
