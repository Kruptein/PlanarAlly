import { SyncTo } from "../../../core/models/types";
import { layerManager } from "../../layers/manager";
import { ownerToClient, ServerShapeOwner } from "../../models/shapes";
import { socket } from "../socket";

socket.on("Shape.Owner.Add", (data: ServerShapeOwner) => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.addOwner(ownerToClient(data), SyncTo.UI);
});

socket.on("Shape.Owner.Update", (data: ServerShapeOwner) => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.updateOwner(ownerToClient(data), SyncTo.UI);
});

socket.on("Shape.Owner.Delete", (data: ServerShapeOwner) => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.removeOwner(data.user, SyncTo.UI);
});
