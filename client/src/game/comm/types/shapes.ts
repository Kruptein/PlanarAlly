import { ShapeOwner, ShapeAccess } from "../../shapes/owners";

export interface ServerShape {
    uuid: string;
    type_: string;
    x: number;
    y: number;
    floor: string;
    layer: string;
    movement_obstruction: boolean;
    vision_obstruction: boolean;
    draw_operator: string;
    trackers: Tracker[];
    auras: ServerAura[];
    labels: Label[];
    owners: ServerShapeOwner[];
    fill_colour: string;
    stroke_colour: string;
    name: string;
    name_visible: boolean;
    annotation: string;
    is_token: boolean;
    is_invisible: boolean;
    options?: string;
    badge: number;
    show_badge: boolean;
    is_locked: boolean;
    default_edit_access: boolean;
    default_movement_access: boolean;
    default_vision_access: boolean;
}

export interface ServerShapeAccess {
    edit_access: boolean;
    movement_access: boolean;
    vision_access: boolean;
}

export interface ServerShapeOwner extends ServerShapeAccess {
    shape: string;
    user: string;
}

export interface ServerRect extends ServerShape {
    width: number;
    height: number;
}

export interface ServerCircle extends ServerShape {
    radius: number;
}

export interface ServerCircularToken extends ServerCircle {
    text: string;
    font: string;
}

export interface ServerLine extends ServerShape {
    x2: number;
    y2: number;
    line_width: number;
}
export interface ServerPolygon extends ServerShape {
    vertices: { x: number; y: number }[];
    open_polygon: boolean;
    line_width: number;
}
export interface ServerText extends ServerShape {
    text: string;
    font: string;
    angle: number;
}
export interface ServerAsset extends ServerRect {
    src: string;
}

export interface ServerAura {
    uuid: string;
    vision_source: boolean;
    visible: boolean;
    name: string;
    value: number;
    dim: number;
    colour: string;
}

export const accessToServer = (access: ShapeAccess): ServerShapeAccess => ({
    // eslint-disable-next-line @typescript-eslint/camelcase
    edit_access: access.edit || false,
    // eslint-disable-next-line @typescript-eslint/camelcase
    movement_access: access.movement || false,
    // eslint-disable-next-line @typescript-eslint/camelcase
    vision_access: access.vision || false,
});

export const ownerToServer = (owner: ShapeOwner): ServerShapeOwner => ({
    user: owner.user,
    shape: owner.shape,
    ...accessToServer(owner.access),
});

export const accessToClient = (access: ServerShapeAccess): ShapeAccess => ({
    edit: access.edit_access,
    movement: access.movement_access,
    vision: access.vision_access,
});

export const ownerToClient = (owner: ServerShapeOwner): ShapeOwner => ({
    user: owner.user,
    shape: owner.shape,
    access: accessToClient(owner),
});
