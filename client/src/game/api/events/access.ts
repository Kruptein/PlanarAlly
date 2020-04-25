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

socket.on("Shape.Owner.Default.Update", (data: { shape: string; edit_access?: boolean; vision_access?: boolean }) => {
    const shape = layerManager.UUIDMap.get(data.shape);
    if (shape === undefined) return;
    shape.updateDefaultOwner({ editAccess: data.edit_access, visionAccess: data.vision_access });
});
