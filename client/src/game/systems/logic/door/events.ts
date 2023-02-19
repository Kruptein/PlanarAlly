import type { ShapeSetBooleanValue, ShapeSetDoorToggleModeValue, ShapeSetPermissionValue } from "../../../../apiTypes";
import { UI_SYNC } from "../../../../core/models/types";
import { socket } from "../../../api/socket";
import { getLocalId } from "../../../id";

import { doorSystem } from ".";

socket.on("Shape.Options.IsDoor.Set", (data: ShapeSetBooleanValue) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    doorSystem.toggle(shape, data.value, UI_SYNC);
});

socket.on("Shape.Options.Door.Permissions.Set", (data: ShapeSetPermissionValue) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    doorSystem.setPermissions(shape, data.value, UI_SYNC);
});

socket.on("Shape.Options.Door.ToggleMode.Set", (data: ShapeSetDoorToggleModeValue) => {
    const shape = getLocalId(data.shape);
    if (shape === undefined) return;
    doorSystem.setToggleMode(shape, data.value, UI_SYNC);
});
