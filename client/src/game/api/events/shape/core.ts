import { SyncMode, SyncTo } from "../../../../core/models/types";
import { floorStore } from "../../../../store/floor";
import { UuidMap } from "../../../../store/shapeMap";
import { LayerName } from "../../../models/floor";
import { ServerShape } from "../../../models/shapes";
import { Shape } from "../../../shapes/shape";
import { deleteShapes } from "../../../shapes/utils";
import { Circle } from "../../../shapes/variants/circle";
import { Rect } from "../../../shapes/variants/rect";
import { Text } from "../../../shapes/variants/text";
import { addShape, moveFloor, moveLayer } from "../../../temp";
import { socket } from "../../socket";

socket.on("Shape.Set", (data: ServerShape) => {
    // hard reset a shape
    const old = UuidMap.get(data.uuid);
    if (old) old.layer.removeShape(old, SyncMode.NO_SYNC, true);
    const _shape = addShape(data, SyncMode.NO_SYNC);
    // if (shape) EventBus.$emit("Shape.Set", shape);
});

socket.on("Shape.Add", (shape: ServerShape) => {
    addShape(shape, SyncMode.NO_SYNC);
});

socket.on("Shapes.Add", (shapes: ServerShape[]) => {
    for (const shape of shapes) {
        addShape(shape, SyncMode.NO_SYNC);
    }
});

socket.on("Shapes.Remove", (shapeIds: string[]) => {
    const shapes = shapeIds.map((s) => UuidMap.get(s)!).filter((s) => s !== undefined);
    deleteShapes(shapes, SyncMode.NO_SYNC);
});

socket.on(
    "Shapes.Position.Update",
    (data: { uuid: string; position: { angle: number; points: [number, number][] } }[]) => {
        for (const sh of data) {
            const shape = UuidMap.get(sh.uuid);
            if (shape === undefined) {
                continue;
            }
            shape.setPositionRepresentation(sh.position);
        }
    },
);

socket.on("Shapes.Options.Update", (data: { uuid: string; option: string }[]) => {
    for (const sh of data) {
        const shape = UuidMap.get(sh.uuid);
        if (shape === undefined) {
            continue;
        }
        shape.setOptions(new Map(JSON.parse(sh.option)), SyncTo.UI);
    }
});

socket.on("Shape.Order.Set", (data: { uuid: string; index: number }) => {
    if (!UuidMap.has(data.uuid)) {
        console.log(`Attempted to move the shape order of an unknown shape`);
        return;
    }
    const shape = UuidMap.get(data.uuid)!;
    shape.layer.moveShapeOrder(shape, data.index, SyncMode.NO_SYNC);
});

socket.on("Shapes.Floor.Change", (data: { uuids: string[]; floor: string }) => {
    const shapes = data.uuids.map((u) => UuidMap.get(u) ?? undefined).filter((s) => s !== undefined) as Shape[];
    if (shapes.length === 0) return;
    moveFloor(shapes, floorStore.getFloor({ name: data.floor })!, false);
    if (shapes.some((s) => s.ownedBy(false, { editAccess: true }))) floorStore.selectFloor({ name: data.floor }, false);
});

socket.on("Shapes.Layer.Change", (data: { uuids: string[]; floor: string; layer: LayerName }) => {
    const shapes = data.uuids.map((u) => UuidMap.get(u) ?? undefined).filter((s) => s !== undefined) as Shape[];
    if (shapes.length === 0) return;
    moveLayer(shapes, floorStore.getLayer(floorStore.getFloor({ name: data.floor })!, data.layer)!, false);
});

socket.on("Shape.Text.Value.Set", (data: { uuid: string; text: string }) => {
    const shape = UuidMap.get(data.uuid) as Text | undefined;
    if (shape === undefined) return;

    shape.text = data.text;
    shape.layer.invalidate(true);
});

socket.on("Shape.Rect.Size.Update", (data: { uuid: string; w: number; h: number }) => {
    const shape = UuidMap.get(data.uuid) as Rect | undefined;
    if (shape === undefined) return;

    shape.w = data.w;
    shape.h = data.h;
    shape.layer.invalidate(!shape.triggersVisionRecalc);
});

socket.on("Shape.Circle.Size.Update", (data: { uuid: string; r: number }) => {
    const shape = UuidMap.get(data.uuid) as Circle | undefined;
    if (shape === undefined) return;

    shape.r = data.r;
    shape.layer.invalidate(!shape.triggersVisionRecalc);
});
