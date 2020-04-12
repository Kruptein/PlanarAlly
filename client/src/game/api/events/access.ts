import { ownerToClient, ServerShapeOwner } from "../../comm/types/shapes";
import { layerManager } from "../../layers/manager";
import { socket } from "../socket";
import { gameStore } from "../../store";

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
    if (data.edit_access) shape.defaultEditAccess = data.edit_access;
    if (data.vision_access) shape.defaultVisionAccess = data.vision_access;
    const ownedIndex = gameStore.ownedtokens.indexOf(shape.uuid);
    if (data.vision_access) {
        if (ownedIndex === -1) gameStore.ownedtokens.push(shape.uuid);
    } else {
        if (ownedIndex >= 0) gameStore.ownedtokens.splice(ownedIndex, 1);
    }
    if (gameStore.fowLOS) layerManager.invalidateLightAllFloors();
});
