import type { ApiOwner } from "../../../apiTypes";
import { getGlobalId, getLocalId, type GlobalId } from "../../id";

import type { ServerShapeAccess, ServerShapeOwner, ShapeAccess, ShapeOwner } from "./models";

export const accessToServer = (access: ShapeAccess): ServerShapeAccess => ({
    edit_access: access.edit,
    movement_access: access.movement,
    vision_access: access.vision,
});

export const ownerToServer = (owner: ShapeOwner): ServerShapeOwner => ({
    user: owner.user,
    shape: getGlobalId(owner.shape)!,
    ...accessToServer(owner.access),
});

export const accessToClient = (access: ServerShapeAccess): ShapeAccess => ({
    edit: access.edit_access,
    movement: access.movement_access,
    vision: access.vision_access,
});

export const ownerToClient = (owner: ApiOwner): ShapeOwner => ({
    user: owner.user,
    shape: getLocalId(owner.shape as GlobalId)!,
    access: accessToClient(owner),
});
