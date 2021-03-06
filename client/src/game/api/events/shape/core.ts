import { SyncMode, SyncTo } from "../../../../core/models/types";
import { EventBus } from "../../../event-bus";
import { layerManager } from "../../../layers/manager";
import { floorStore, getFloorId } from "../../../layers/store";
import { moveFloor, moveLayer } from "../../../layers/utils";
import { gameManager } from "../../../manager";
import { ServerShape } from "../../../models/shapes";
import { Shape } from "../../../shapes/shape";
import { deleteShapes } from "../../../shapes/utils";
import { Circle } from "../../../shapes/variants/circle";
import { Rect } from "../../../shapes/variants/rect";
import { Text } from "../../../shapes/variants/text";
import { socket } from "../../socket";

socket.on("Shape.Set", (data: ServerShape) => {
    // hard reset a shape
    const old = layerManager.UUIDMap.get(data.uuid);
    if (old) old.layer.removeShape(old, SyncMode.NO_SYNC, true);
    const shape = gameManager.addShape(data, SyncMode.NO_SYNC);
    if (shape) EventBus.$emit("Shape.Set", shape);
});

socket.on("Shape.Add", (shape: ServerShape) => {
    gameManager.addShape(shape, SyncMode.NO_SYNC);
});

socket.on("Shapes.Add", (shapes: ServerShape[]) => {
    for (const shape of shapes) {
        gameManager.addShape(shape, SyncMode.NO_SYNC);
    }
});

socket.on("Shapes.Remove", (shapeIds: string[]) => {
    // We use ! on the get here even though to silence the typechecker as we filter undefineds later.
    const shapes = shapeIds.map((s) => layerManager.UUIDMap.get(s)!).filter((s) => s !== undefined);
    deleteShapes(shapes, SyncMode.NO_SYNC);
});

socket.on("Shapes.Position.Update", (data: { uuid: string; position: { angle: number; points: number[][] } }[]) => {
    for (const sh of data) {
        const shape = layerManager.UUIDMap.get(sh.uuid);
        if (shape === undefined) {
            continue;
        }
        shape.setPositionRepresentation(sh.position);
    }
});

socket.on("Shapes.Options.Update", (data: { uuid: string; option: string }[]) => {
    for (const sh of data) {
        const shape = layerManager.UUIDMap.get(sh.uuid);
        if (shape === undefined) {
            continue;
        }
        shape.setOptions(new Map(JSON.parse(sh.option)), SyncTo.UI);
    }
});

socket.on("Shape.Order.Set", (data: { uuid: string; index: number }) => {
    if (!layerManager.UUIDMap.has(data.uuid)) {
        console.log(`Attempted to move the shape order of an unknown shape`);
        return;
    }
    const shape = layerManager.UUIDMap.get(data.uuid)!;
    shape.layer.moveShapeOrder(shape, data.index, SyncMode.NO_SYNC);
});

socket.on("Shapes.Floor.Change", (data: { uuids: string[]; floor: string }) => {
    const shapes = data.uuids
        .map((u) => layerManager.UUIDMap.get(u) ?? undefined)
        .filter((s) => s !== undefined) as Shape[];
    if (shapes.length === 0) return;
    moveFloor(shapes, layerManager.getFloor(getFloorId(data.floor))!, false);
    if (shapes.some((s) => s.ownedBy(false, { editAccess: true })))
        floorStore.selectFloor({ targetFloor: data.floor, sync: false });
});

socket.on("Shapes.Layer.Change", (data: { uuids: string[]; floor: string; layer: string }) => {
    const shapes = data.uuids
        .map((u) => layerManager.UUIDMap.get(u) ?? undefined)
        .filter((s) => s !== undefined) as Shape[];
    if (shapes.length === 0) return;
    moveLayer(shapes, layerManager.getLayer(layerManager.getFloor(getFloorId(data.floor))!, data.layer)!, false);
});

socket.on("Shape.Text.Value.Set", (data: { uuid: string; text: string }) => {
    const shape = layerManager.UUIDMap.get(data.uuid) as Text | undefined;
    if (shape === undefined) return;

    shape.text = data.text;
    shape.layer.invalidate(true);
});

socket.on("Shape.Rect.Size.Update", (data: { uuid: string; w: number; h: number }) => {
    const shape = layerManager.UUIDMap.get(data.uuid) as Rect | undefined;
    if (shape === undefined) return;

    shape.w = data.w;
    shape.h = data.h;
    shape.layer.invalidate(!shape.triggersVisionRecalc);
});

socket.on("Shape.Circle.Size.Update", (data: { uuid: string; r: number }) => {
    const shape = layerManager.UUIDMap.get(data.uuid) as Circle | undefined;
    if (shape === undefined) return;

    shape.r = data.r;
    shape.layer.invalidate(!shape.triggersVisionRecalc);
});
