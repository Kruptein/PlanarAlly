import type { ApiShapeOwner } from "../../../apiTypes";
import { getGlobalId, getLocalId } from "../../id";

import type { ServerShapeAccess, AccessConfig, ShapeOwner } from "./models";

export const accessToServer = (access: AccessConfig): ServerShapeAccess => ({
    edit_access: access.edit,
    movement_access: access.movement,
    vision_access: access.vision,
});

export const ownerToServer = (owner: ShapeOwner): ApiShapeOwner => ({
    user: owner.user,
    shape: getGlobalId(owner.shape)!,
    ...accessToServer(owner.access),
});

export const accessToClient = (access: ServerShapeAccess): AccessConfig => ({
    edit: access.edit_access,
    movement: access.movement_access,
    vision: access.vision_access,
});

export const ownerToClient = (owner: ApiShapeOwner): ShapeOwner => ({
    user: owner.user,
    shape: getLocalId(owner.shape)!,
    access: accessToClient(owner),
});
