import { SyncMode } from "../../../../core/comm/types";
import { ServerShape } from "../../../comm/types/shapes";
import { EventBus } from "../../../event-bus";
import { layerManager } from "../../../layers/manager";
import { floorStore, getFloorId } from "../../../layers/store";
import { moveFloor, moveLayer } from "../../../layers/utils";
import { gameManager } from "../../../manager";
import { changeGroupLeader, addGroupMember } from "../../../shapes/group";
import { Shape } from "../../../shapes/shape";
import { socket } from "../../socket";
import { Text } from "../../../shapes/text";
import { Rect } from "../../../shapes/rect";
import { Circle } from "../../../shapes/circle";

socket.on("Shape.Set", (data: ServerShape) => {
    // hard reset a shape
    const old = layerManager.UUIDMap.get(data.uuid);
    if (old) old.layer.removeShape(old, SyncMode.NO_SYNC);
    const shape = gameManager.addShape(data);
    if (shape) EventBus.$emit("Shape.Set", shape);
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

socket.on("Shapes.Position.Update", (data: { uuid: string; position: { angle: number; points: number[][] } }[]) => {
    for (const sh of data) {
        const shape = layerManager.UUIDMap.get(sh.uuid);
        if (shape === undefined) {
            console.log(`Attempted to move unknown shape ${sh.uuid}`);
            continue;
        }
        shape.setPositionRepresentation(sh.position);
    }
});

socket.on("Shape.Order.Set", (data: { uuid: string; index: number }) => {
    if (!layerManager.UUIDMap.has(data.uuid)) {
        console.log(`Attempted to move the shape order of an unknown shape`);
        return;
    }
    const shape = layerManager.UUIDMap.get(data.uuid)!;
    shape.layer.moveShapeOrder(shape, data.index, false);
});

socket.on("Shapes.Floor.Change", (data: { uuids: string[]; floor: string }) => {
    const shapes = <Shape[]>data.uuids.map(u => layerManager.UUIDMap.get(u) ?? undefined).filter(s => s !== undefined);
    if (shapes.length === 0) return;
    moveFloor(shapes, layerManager.getFloor(getFloorId(data.floor))!, false);
    if (shapes.some(s => s.ownedBy({ editAccess: true })))
        floorStore.selectFloor({ targetFloor: data.floor, sync: false });
});

socket.on("Shapes.Layer.Change", (data: { uuids: string[]; floor: string; layer: string }) => {
    const shapes = <Shape[]>data.uuids.map(u => layerManager.UUIDMap.get(u) ?? undefined).filter(s => s !== undefined);
    if (shapes.length === 0) return;
    moveLayer(shapes, layerManager.getLayer(layerManager.getFloor(getFloorId(data.floor))!, data.layer)!, false);
});

socket.on("Shapes.Group.Leader.Set", (data: { leader: string; members: string[] }) => {
    changeGroupLeader({ ...data, sync: false });
});

socket.on("Shapes.Group.Member.Add", (data: { leader: string; member: string }) => {
    addGroupMember({ ...data, sync: false });
});

socket.on(
    "Shapes.Trackers.Update",
    (data: { uuid: string; value: number; shape: string; _type: "tracker" | "aura" }) => {
        const shape = layerManager.UUIDMap.get(data.shape);
        if (shape === undefined) return;

        let tracker: Tracker | Aura | undefined;
        if (data._type === "tracker") tracker = shape.trackers.find(t => t.uuid === data.uuid);
        else tracker = shape.auras.find(a => a.uuid === data.uuid);
        if (tracker !== undefined) {
            tracker.value = data.value;
            if (data._type === "aura") shape.layer.invalidate(!(<Aura>tracker).visionSource);
        }
    },
);

socket.on("Shape.Text.Value.Set", (data: { uuid: string; text: string }) => {
    const shape = <Text | undefined>layerManager.UUIDMap.get(data.uuid);
    if (shape === undefined) return;

    shape.text = data.text;
    shape.layer.invalidate(true);
});

socket.on("Shape.Rect.Size.Update", (data: { uuid: string; w: number; h: number }) => {
    const shape = <Rect | undefined>layerManager.UUIDMap.get(data.uuid);
    if (shape === undefined) return;

    shape.w = data.w;
    shape.h = data.h;
    shape.layer.invalidate(!shape.triggersVisionRecalc);
});

socket.on("Shape.Circle.Size.Update", (data: { uuid: string; r: number }) => {
    const shape = <Circle | undefined>layerManager.UUIDMap.get(data.uuid);
    if (shape === undefined) return;

    shape.r = data.r;
    shape.layer.invalidate(!shape.triggersVisionRecalc);
});
