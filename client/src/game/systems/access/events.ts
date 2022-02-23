import { SyncTo } from "../../../core/models/types";
import { socket } from "../../api/socket";
import { getLocalId } from "../../id";

import { accessToClient, ownerToClient } from "./helpers";
import type { ServerShapeOwner } from "./models";

import { accessSystem } from ".";

socket.on("Shape.Owner.Add", (data: ServerShapeOwner) => {
    const clientData = ownerToClient(data);
    accessSystem.addAccess(clientData.shape, clientData.user, clientData.access, SyncTo.UI);
});

socket.on("Shape.Owner.Update", (data: ServerShapeOwner) => {
    const id = getLocalId(data.shape);
    if (id === undefined) return;
    accessSystem.updateAccess(id, data.user, accessToClient(data), SyncTo.UI);
});

socket.on("Shape.Owner.Delete", (data: ServerShapeOwner) => {
    const id = getLocalId(data.shape);
    if (id === undefined) return;
    accessSystem.removeAccess(id, data.user, SyncTo.UI);
});
