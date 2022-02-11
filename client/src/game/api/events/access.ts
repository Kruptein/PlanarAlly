import { SyncTo } from "../../../core/models/types";
import { getLocalId, getShape } from "../../id";
import { ownerToClient } from "../../models/shapes";
import type { ServerShapeOwner } from "../../models/shapes";
import { socket } from "../socket";

socket.on("Shape.Owner.Add", (data: ServerShapeOwner) => {
    const shape = getShape(getLocalId(data.shape)!);
    if (shape === undefined) return;
    shape.addOwner(ownerToClient(data), SyncTo.UI);
});

socket.on("Shape.Owner.Update", (data: ServerShapeOwner) => {
    const shape = getShape(getLocalId(data.shape)!);
    if (shape === undefined) return;
    shape.updateOwner(ownerToClient(data), SyncTo.UI);
});

socket.on("Shape.Owner.Delete", (data: ServerShapeOwner) => {
    const shape = getShape(getLocalId(data.shape)!);
    if (shape === undefined) return;
    shape.removeOwner(data.user, SyncTo.UI);
});
