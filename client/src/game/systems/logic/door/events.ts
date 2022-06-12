import { UI_SYNC } from "../../../../core/models/types";
import { socket } from "../../../api/socket";
import { getLocalId } from "../../../id";
import type { GlobalId } from "../../../id";
import type { Permissions } from "../models";

import type { DOOR_TOGGLE_MODE } from "./models";

import { doorSystem } from ".";

socket.on("Shape.Options.IsDoor.Set", (data: { shape: GlobalId; value: boolean }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    doorSystem.toggle(shape, data.value, UI_SYNC);
});

socket.on("Shape.Options.Door.Permissions.Set", (data: { shape: GlobalId; value: Permissions }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    doorSystem.setPermissions(shape, data.value, UI_SYNC);
});

socket.on("Shape.Options.Door.ToggleMode.Set", (data: { shape: GlobalId; value: DOOR_TOGGLE_MODE }) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    doorSystem.setToggleMode(shape, data.value, UI_SYNC);
});
