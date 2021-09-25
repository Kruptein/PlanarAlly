import type { Label } from "../shapes/interfaces";
import type { ShapeAccess, ShapeOwner } from "../shapes/owners";
import type { SHAPE_TYPE } from "../shapes/types";

import type { LayerName } from "./floor";

export interface ServerShape {
    uuid: string;
    type_: SHAPE_TYPE;
    x: number;
    y: number;
    angle: number;
    floor: string;
    layer: LayerName;
    movement_obstruction: boolean;
    vision_obstruction: boolean;
    draw_operator: string;
    trackers: ServerTracker[];
    auras: ServerAura[];
    labels: Label[];
    owners: ServerShapeOwner[];
    fill_colour: string;
    stroke_colour: string;
    stroke_width: number;
    name: string;
    name_visible: boolean;
    annotation: string;
    annotation_visible: boolean;
    is_token: boolean;
    is_invisible: boolean;
    is_defeated: boolean;
    options?: string;
    badge: number;
    show_badge: boolean;
    is_locked: boolean;
    default_edit_access: boolean;
    default_movement_access: boolean;
    default_vision_access: boolean;
    asset?: number;
    group?: string;
    ignore_zoom_size: boolean;
}

interface ServerShapeAccess {
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
    viewing_angle: number | null;
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
    vertices: [number, number][];
    open_polygon: boolean;
    line_width: number;
}
export interface ServerText extends ServerShape {
    text: string;
    font_size: number;
}

export interface ServerToggleComposite extends ServerShape {
    active_variant: string;
    variants: { uuid: string; name: string }[];
}
export interface ServerAsset extends ServerRect {
    src: string;
}

export interface ServerTracker {
    shape: string;
    uuid: string;
    visible: boolean;
    name: string;
    value: number;
    maxvalue: number;
    draw: boolean;
    primary_color: string;
    secondary_color: string;
}

export interface ServerAura {
    shape: string;
    uuid: string;
    active: boolean;
    vision_source: boolean;
    visible: boolean;
    name: string;
    value: number;
    dim: number;
    colour: string;
    border_colour: string;
    angle: number;
    direction: number;
}

export const accessToServer = (access: ShapeAccess): ServerShapeAccess => ({
    edit_access: access.edit || false,
    movement_access: access.movement || false,
    vision_access: access.vision || false,
});

export const ownerToServer = (owner: ShapeOwner): ServerShapeOwner => ({
    user: owner.user,
    shape: owner.shape,
    ...accessToServer(owner.access),
});

const accessToClient = (access: ServerShapeAccess): ShapeAccess => ({
    edit: access.edit_access,
    movement: access.movement_access,
    vision: access.vision_access,
});

export const ownerToClient = (owner: ServerShapeOwner): ShapeOwner => ({
    user: owner.user,
    shape: owner.shape,
    access: accessToClient(owner),
});

export interface ShapeOptions {
    isPlayerRect: boolean;

    preFogShape: boolean;
    skipDraw: boolean;
    borderOperation: string;

    // legacy svg stuff
    svgHeight: number;
    svgPaths: string[];
    svgWidth: number;
    // new svg stuff
    svgAsset: string;

    UiHelper: boolean;
}
