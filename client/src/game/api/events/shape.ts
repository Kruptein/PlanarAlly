import { SyncMode } from "../../../core/comm/types";
import { ServerShape } from "../../comm/types/shapes";
import { EventBus } from "../../event-bus";
import { layerManager } from "../../layers/manager";
import { gameManager } from "../../manager";
import { gameStore } from "../../store";
import { socket } from "../socket";

// todo: why full shape and not just uuid?
function removeShape(shape: ServerShape): void {
    if (!layerManager.UUIDMap.has(shape.uuid)) {
        console.log(`Attempted to remove an unknown shape`);
        return;
    }
    if (!layerManager.hasLayer(shape.floor, shape.layer)) {
        console.log(`Attempted to remove shape from an unknown layer ${shape.layer}`);
        return;
    }
    const layer = layerManager.getLayer(shape.floor, shape.layer)!;
    layer.removeShape(layerManager.UUIDMap.get(shape.uuid)!, SyncMode.NO_SYNC);
}

socket.on("Shape.Set", (data: ServerShape) => {
    // hard reset a shape
    const old = layerManager.UUIDMap.get(data.uuid);
    if (old) layerManager.getLayer(old.floor, old.layer)?.removeShape(old, SyncMode.NO_SYNC);
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
    if (!layerManager.hasLayer(data.shape.floor, data.shape.layer)) {
        console.log(`Attempted to remove shape from an unknown layer ${data.shape.layer}`);
        return;
    }
    const shape = layerManager.UUIDMap.get(data.shape.uuid)!;
    const layer = layerManager.getLayer(shape.floor, shape.layer)!;
    layer.moveShapeOrder(shape, data.index, false);
});

socket.on("Shape.Floor.Change", (data: { uuid: string; floor: string }) => {
    const shape = layerManager.UUIDMap.get(data.uuid);
    if (shape === undefined) return;
    shape.moveFloor(data.floor, false);
    if (shape.ownedBy({ editAccess: true })) gameStore.selectFloor({ targetFloor: data.floor, sync: false });
});

socket.on("Shape.Layer.Change", (data: { uuid: string; layer: string }) => {
    const shape = layerManager.UUIDMap.get(data.uuid);
    if (shape === undefined) return;
    shape.moveLayer(data.layer, false);
});

socket.on("Shape.Update", (data: { shape: ServerShape; redraw: boolean }) => {
    gameManager.updateShape(data);
});
