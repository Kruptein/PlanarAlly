import type {
    ApiShape,
    ApiShapeAdd,
    ShapeCircleSizeUpdate,
    ShapeFloorChange,
    ShapeInfo,
    ShapeLayerChange,
    ShapeLocationMove,
    ShapeOrder,
    ShapeRectSizeUpdate,
    ShapesPositionUpdateList,
    ShapeTextSizeUpdate,
    TemporaryShapes,
} from "../../../../apiTypes";
import type { GlobalId } from "../../../../core/id";
import { getGlobalId } from "../../../id";
import type { IShape } from "../../../interfaces/shape";
import type { ICircle } from "../../../interfaces/shapes/circle";
import type { IRect } from "../../../interfaces/shapes/rect";
import type { IText } from "../../../interfaces/shapes/text";
import { wrapSocket, socket } from "../../socket";

export const sendShapeAdd = wrapSocket<ApiShapeAdd>("Shape.Add");
export const sendRemoveShapes = (data: TemporaryShapes): void => {
    if (data.uuids.length === 0) {
        if (import.meta.env.NODE_ENV === "production") {
            console.error(
                "Attempted to send shape removal request for 0 shapes. If you think this is a bug, please report this!",
            );
        } else {
            // eslint-disable-next-line no-debugger
            debugger;
        }
    } else wrapSocket<TemporaryShapes>("Shapes.Remove")(data);
};
export const sendShapeOrder = wrapSocket<ShapeOrder>("Shape.Order.Set");
export const sendFloorChange = wrapSocket<ShapeFloorChange>("Shapes.Floor.Change");
export const sendLayerChange = wrapSocket<ShapeLayerChange>("Shapes.Layer.Change");

export const sendShapesMove = wrapSocket<ShapeLocationMove>("Shapes.Location.Move");

export function sendShapePositionUpdate(shapes: readonly IShape[], temporary: boolean): void {
    const positions = shapes
        .filter((s) => !s.preventSync)
        .map((s) => ({ uuid: getGlobalId(s.id)!, position: s.getPositionRepresentation() }));
    if (positions.length > 0) _sendShapePositionUpdate({ shapes: positions, temporary });
}

export function sendShapeSizeUpdate(data: { shape: IShape; temporary: boolean }): void {
    switch (data.shape.type) {
        case "assetrect":
        case "rect": {
            const shape = data.shape as IRect;
            const uuid = getGlobalId(shape.id);
            if (uuid === undefined) return;
            // a shape resize can move the refpoint!
            sendShapePositionUpdate([data.shape], data.temporary);
            _sendRectSizeUpdate({ uuid, w: shape.w, h: shape.h, temporary: data.temporary });
            break;
        }
        case "circulartoken":
        case "circle": {
            const shape = data.shape as ICircle;
            const uuid = getGlobalId(shape.id);
            if (uuid === undefined) return;
            _sendCircleSizeUpdate({ uuid, r: shape.r, temporary: data.temporary });
            break;
        }
        case "polygon": {
            sendShapePositionUpdate([data.shape], data.temporary);
            break;
        }
        case "text": {
            const shape = data.shape as IText;
            const uuid = getGlobalId(shape.id);
            if (uuid === undefined) return;
            _sendTextSizeUpdate({ uuid, font_size: shape.fontSize, temporary: data.temporary });
        }
    }
}

export async function requestShapeInfo(shape: string): Promise<ShapeInfo> {
    socket.emit("Shape.Info.Get", shape);
    return new Promise((resolve: (value: ShapeInfo) => void) => socket.once("Shape.Info", resolve));
}

export async function fetchFullShape(shapeId: GlobalId): Promise<ApiShape | undefined> {
    return (await socket.emitWithAck("Shape.Get", shapeId)) as ApiShape | undefined;
}

// helpers

const _sendRectSizeUpdate = wrapSocket<ShapeRectSizeUpdate>("Shape.Rect.Size.Update");
const _sendCircleSizeUpdate = wrapSocket<ShapeCircleSizeUpdate>("Shape.Circle.Size.Update");
const _sendTextSizeUpdate = wrapSocket<ShapeTextSizeUpdate>("Shape.Text.Size.Update");

function _sendShapePositionUpdate(data: ShapesPositionUpdateList): void {
    socket.emit("Shapes.Position.Update", data);
}
