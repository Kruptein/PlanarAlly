import { SyncTo } from "../../../../core/models/types";
import { socket } from "../../../api/socket";
import { getLocalId } from "../../../id";
import type { GlobalId } from "../../../id";
import type { Permissions } from "../models";

import { doorSystem } from ".";

socket.on("Shape.Options.IsDoor.Set", (data: { shape: GlobalId; value: boolean }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    doorSystem.toggle(shape, data.value, SyncTo.UI);
});

socket.on("Shape.Options.DoorPermissions.Set", (data: { shape: GlobalId; value: Permissions }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    doorSystem.setPermissions(shape, data.value, SyncTo.UI);
});
