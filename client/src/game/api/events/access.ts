import { ownerToClient, ServerShapeOwner } from "../../comm/types/shapes";
import { layerManager } from "../../layers/manager";
import { socket } from "../socket";

socket.on("Shape.Owner.Add", (data: ServerShapeOwner) => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.addOwner(ownerToClient(data), false);
});

socket.on("Shape.Owner.Update", (data: ServerShapeOwner) => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.updateOwner(ownerToClient(data), false);
});

socket.on("Shape.Owner.Delete", (data: ServerShapeOwner) => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.removeOwner(data.user, false);
});
