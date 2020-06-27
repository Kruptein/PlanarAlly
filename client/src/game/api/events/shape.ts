import { SyncMode } from "../../../core/comm/types";
import { ServerShape } from "../../comm/types/shapes";
import { EventBus } from "../../event-bus";
import { layerManager } from "../../layers/manager";
import { floorStore } from "../../layers/store";
import { moveFloor } from "../../layers/utils";
import { gameManager } from "../../manager";
import { Shape } from "../../shapes/shape";
import { socket } from "../socket";

// todo: why full shape and not just uuid?
function removeShape(shape: ServerShape): void {
    if (!layerManager.UUIDMap.has(shape.uuid)) {
        console.log(`Attempted to remove an unknown shape`);
        return;
    }
    if (!layerManager.hasLayer(layerManager.getFloor(shape.floor)!, shape.layer)) {
        console.log(`Attempted to remove shape from an unknown layer ${shape.layer}`);
        return;
    }
    const layer = layerManager.getLayer(layerManager.getFloor(shape.floor)!, shape.layer)!;
    layer.removeShape(layerManager.UUIDMap.get(shape.uuid)!, SyncMode.NO_SYNC);
}

socket.on("Shape.Set", (data: ServerShape) => {
    // hard reset a shape
    const old = layerManager.UUIDMap.get(data.uuid);
    if (old) old.layer.removeShape(old, SyncMode.NO_SYNC);
    const shape = gameManager.addShape(data);
    if (shape) EventBus.$emit("Shape.Set", shape);
});

socket.on("Shape.Options.Invisible.Set", (data: { shape: string; is_invisible: boolean }) => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.setInvisible(data.is_invisible, false);
});

socket.on("Shape.Options.Locked.Set", (data: { shape: string; is_locked: boolean }) => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.setLocked(data.is_locked, false);
});

socket.on("Shape.Add", (shape: ServerShape) => {
    gameManager.addShape(shape);
});

socket.on("Shapes.Add", (shapes: ServerShape[]) => {
    shapes.forEach(shape => gameManager.addShape(shape));
});

socket.on("Shape.Remove", (shape: ServerShape) => {
    removeShape(shape);
});

socket.on("Shapes.Remove", (shapes: ServerShape[]) => {
    shapes.forEach(shape => removeShape(shape));
});

socket.on("Shape.Order.Set", (data: { shape: ServerShape; index: number }) => {
    if (!layerManager.UUIDMap.has(data.shape.uuid)) {
        console.log(`Attempted to move the shape order of an unknown shape`);
        return;
    }
    if (!layerManager.hasLayer(layerManager.getFloor(data.shape.floor)!, data.shape.layer)) {
        console.log(`Attempted to remove shape from an unknown layer ${data.shape.layer}`);
        return;
    }
    const shape = layerManager.UUIDMap.get(data.shape.uuid)!;
    shape.layer.moveShapeOrder(shape, data.index, false);
});

socket.on("Shapes.Floor.Change", (data: { uuids: string[]; floor: string }) => {
    const shapes = <Shape[]>data.uuids.map(u => layerManager.UUIDMap.get(u) ?? undefined).filter(s => s !== undefined);
    if (shapes.length === 0) return;
    moveFloor(shapes, layerManager.getFloor(data.floor)!, false);
    if (shapes.some(s => s.ownedBy({ editAccess: true })))
        floorStore.selectFloor({ targetFloor: data.floor, sync: false });
});

socket.on("Shape.Layer.Change", (data: { uuid: string; layer: string }) => {
    const shape = layerManager.UUIDMap.get(data.uuid);
    if (shape === undefined) return;
    shape.moveLayer(data.layer, false);
});

socket.on("Shape.Update", (data: { shape: ServerShape; redraw: boolean }) => {
    gameManager.updateShape(data);
});
