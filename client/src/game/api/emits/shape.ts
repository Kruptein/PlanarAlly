import { ServerShape } from "../../comm/types/shapes";
import { Shape } from "../../shapes/shape";
import { socket } from "../socket";

export function sendShapeSetInvisible(data: { shape: string; is_invisible: boolean }): void {
    socket.emit("Shape.Options.Invisible.Set", data);
}

export function sendShapeSetLocked(data: { shape: string; is_locked: boolean }): void {
    socket.emit("Shape.Options.Locked.Set", data);
}

export function sendShapeAdd(data: { shape: ServerShape; temporary: boolean }): void {
    socket.emit("Shape.Add", data);
}

export function sendRemoveShapes(data: { uuids: string[]; temporary: boolean }): void {
    socket.emit("Shapes.Remove", data);
}

export function sendShapePositionUpdate(shapes: readonly Shape[], temporary: boolean): void {
    _sendShapePositionUpdate(
        shapes.filter(s => !s.preventSync).map(s => ({ uuid: s.uuid, points: s.getPositionRepresentation() })),
        temporary,
    );
}

export function sendShapeOrder(data: { uuid: string; index: number }): void {
    socket.emit("Shape.Order.Set", data);
}

export function sendFloorChange(data: { uuids: string[]; floor: string }): void {
    socket.emit("Shapes.Floor.Change", data);
}

export function sendLayerChange(data: { uuids: string[]; layer: string; floor: string }): void {
    socket.emit("Shapes.Layer.Change", data);
}

export function sendShapesMove(data: {
    shapes: string[];
    target: { location: number; floor: string; x: number; y: number };
}): void {
    socket.emit("Shapes.Location.Move", data);
}

export function sendGroupLeaderUpdate(data: { leader: string; members: string[] }): void {
    socket.emit("Shapes.Group.Leader.Set", data);
}

export function sendGroupMemberAdd(data: { leader: string; member: string }): void {
    socket.emit("Shapes.Group.Member.Add", data);
}

// helpers

function _sendShapePositionUpdate(shapes: { uuid: string; points: number[][] }[], temporary: boolean): void {
    socket.emit("Shapes.Position.Update", {
        shapes,
        redraw: true,
        temporary,
    });
}
