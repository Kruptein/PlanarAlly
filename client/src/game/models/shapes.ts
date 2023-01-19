import type { ApiShape } from "../../apiTypes";
import type { GlobalId } from "../id";
import type { DoorOptions } from "../systems/logic/door/models";
import type { TeleportOptions } from "../systems/logic/tp/models";

// export interface ServerShape {
//     uuid: GlobalId;
//     type_: SHAPE_TYPE;
//     x: number;
//     y: number;
//     angle: number;
//     floor: string; // @
//     layer: LayerName; // @
//     movement_obstruction: boolean;
//     vision_obstruction: boolean;
//     draw_operator: GlobalCompositeOperation;
//     trackers: ServerTracker[]; // @
//     auras: ServerAura[]; // @
//     labels: Label[]; // @
//     owners: ServerShapeOwner[]; // @
//     fill_colour: string;
//     stroke_colour: string;
//     stroke_width: number;
//     name: string;
//     name_visible: boolean;
//     annotation: string;
//     annotation_visible: boolean;
//     is_token: boolean;
//     is_invisible: boolean;
//     is_defeated: boolean;
//     options?: string; // ~
//     badge: number;
//     show_badge: boolean;
//     is_locked: boolean;
//     default_edit_access: boolean;
//     default_movement_access: boolean;
//     default_vision_access: boolean;
//     asset?: number; // @
//     group?: string; // @
//     ignore_zoom_size: boolean;
//     is_door: boolean;
//     is_teleport_zone: boolean;
// }

export interface ServerRect extends ApiShape {
    width: number;
    height: number;
}

export interface ServerCircle extends ApiShape {
    radius: number;
    viewing_angle: number | null;
}

export interface ServerCircularToken extends ServerCircle {
    text: string;
    font: string;
}

export interface ServerLine extends ApiShape {
    x2: number;
    y2: number;
    line_width: number;
}
export interface ServerPolygon extends ApiShape {
    vertices: [number, number][];
    open_polygon: boolean;
    line_width: number;
}
export interface ServerText extends ApiShape {
    text: string;
    font_size: number;
}

export interface ServerToggleComposite extends ApiShape {
    active_variant: GlobalId;
    variants: { uuid: GlobalId; name: string }[];
}
export interface ServerAsset extends ServerRect {
    src: string;
}

export interface ShapeOptions {
    isPlayerRect: boolean;

    preFogShape: boolean;
    skipDraw: boolean;
    borderOperation: GlobalCompositeOperation;

    // legacy svg stuff
    svgHeight: number;
    svgPaths: string[];
    svgWidth: number;
    // new svg stuff
    svgAsset: string;

    UiHelper: boolean;
}

export interface ServerShapeOptions extends ShapeOptions {
    // logic
    door: DoorOptions;
    teleport: TeleportOptions;
}
