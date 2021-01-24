import { ServerShape } from "../../../comm/types/shapes";
import { Shape } from "../../../shapes/shape";
import { Circle } from "../../../shapes/variants/circle";
import { Rect } from "../../../shapes/variants/rect";
import { wrapSocket } from "../../helpers";
import { socket } from "../../socket";

export const sendShapeAdd = wrapSocket<{ shape: ServerShape; temporary: boolean }>("Shape.Add");
export const sendRemoveShapes = wrapSocket<{ uuids: string[]; temporary: boolean }>("Shapes.Remove");
export const sendShapeOrder = wrapSocket<{ uuid: string; index: number; temporary: boolean }>("Shape.Order.Set");
export const sendFloorChange = wrapSocket<{ uuids: string[]; floor: string }>("Shapes.Floor.Change");
export const sendLayerChange = wrapSocket<{ uuids: string[]; layer: string; floor: string }>("Shapes.Layer.Change");

export const sendShapesMove = wrapSocket<{
    shapes: string[];
    target: { location: number; floor: string; x: number; y: number };
}>("Shapes.Location.Move");
export const sendTextUpdate = wrapSocket<{ uuid: string; text: string; temporary: boolean }>("Shape.Text.Value.Set");

export function sendShapeOptionsUpdate(shapes: readonly Shape[], temporary: boolean): void {
    const options = shapes.filter((s) => !s.preventSync).map((s) => ({ uuid: s.uuid, option: s.getOptions() }));
    if (options.length > 0) {
        socket.emit("Shapes.Options.Update", {
            options,
            temporary,
        });
    }
}

export function sendShapePositionUpdate(shapes: readonly Shape[], temporary: boolean): void {
    const positions = shapes
        .filter((s) => !s.preventSync)
        .map((s) => ({ uuid: s.uuid, position: s.getPositionRepresentation() }));
    if (positions.length > 0) _sendShapePositionUpdate(positions, temporary);
}

export function sendShapeSizeUpdate(data: { shape: Shape; temporary: boolean }): void {
    switch (data.shape.type) {
        case "assetrect":
        case "rect": {
            const shape = data.shape as Rect;
            // a shape resize can move the refpoint!
            sendShapePositionUpdate([data.shape], data.temporary);
            _sendRectSizeUpdate({ uuid: shape.uuid, w: shape.w, h: shape.h, temporary: data.temporary });
            break;
        }
        case "circulartoken":
        case "circle": {
            const shape = data.shape as Circle;
            _sendCircleSizeUpdate({ uuid: shape.uuid, r: shape.r, temporary: data.temporary });
            break;
        }
        case "polygon": {
            sendShapePositionUpdate([data.shape], data.temporary);
            break;
        }
    }
}

// helpers

const _sendRectSizeUpdate = wrapSocket<{ uuid: string; w: number; h: number; temporary: boolean }>(
    "Shape.Rect.Size.Update",
);
const _sendCircleSizeUpdate = wrapSocket<{ uuid: string; r: number; temporary: boolean }>("Shape.Circle.Size.Update");

function _sendShapePositionUpdate(
    shapes: { uuid: string; position: { angle: number; points: number[][] } }[],
    temporary: boolean,
): void {
    socket.emit("Shapes.Position.Update", {
        shapes,
        redraw: true,
        temporary,
    });
}
