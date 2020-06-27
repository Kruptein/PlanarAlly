import { SyncMode } from "../../../core/comm/types";
import { ServerShape } from "../../comm/types/shapes";
import { EventBus } from "../../event-bus";
import { layerManager } from "../../layers/manager";
import { floorStore } from "../../layers/store";
import { moveFloor, moveLayer } from "../../layers/utils";
import { gameManager } from "../../manager";
import { Shape } from "../../shapes/shape";
import { socket } from "../socket";

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

socket.on("Shapes.Remove", (shapes: string[]) => {
    for (const uid of shapes) {
        const shape = layerManager.UUIDMap.get(uid);
        if (shape !== undefined) shape.layer.removeShape(shape, SyncMode.NO_SYNC);
    }
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

socket.on("Shapes.Layer.Change", (data: { uuids: string[]; floor: string; layer: string }) => {
    const shapes = <Shape[]>data.uuids.map(u => layerManager.UUIDMap.get(u) ?? undefined).filter(s => s !== undefined);
    if (shapes.length === 0) return;
    moveLayer(shapes, layerManager.getLayer(layerManager.getFloor(data.floor)!, data.layer)!, false);
});

socket.on("Shape.Update", (data: { shape: ServerShape; redraw: boolean }) => {
    gameManager.updateShape(data);
});
