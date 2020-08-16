import { ServerShapeOwner } from "../../comm/types/shapes";
import { socket } from "../socket";

export function sendShapeAddOwner(data: ServerShapeOwner): void {
    socket.emit("Shape.Owner.Add", data);
}

export function sendShapeUpdateOwner(data: ServerShapeOwner): void {
    socket.emit("Shape.Owner.Update", data);
}

export function sendShapeDeleteOwner(data: ServerShapeOwner): void {
    socket.emit("Shape.Owner.Delete", data);
}

export function sendShapeUpdateDefaultOwner(data: Omit<ServerShapeOwner, "user">): void {
    socket.emit("Shape.Owner.Default.Update", data);
}
