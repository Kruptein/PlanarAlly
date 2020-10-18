import { SHAPE_TYPE } from "../../shapes/types";
import {
    ServerAsset,
    ServerAura,
    ServerCircle,
    ServerCircularToken,
    ServerLine,
    ServerPolygon,
    ServerRect,
    ServerShape,
    ServerText,
    ServerTracker,
} from "./shapes";

// Some of these keys are added later but with restrictions
export const BaseTemplateStrings = [
    "type_",
    "angle",
    "movement_obstruction",
    "vision_obstruction",
    "fill_colour",
    "stroke_colour",
    "stroke_width",
    "name",
    "name_visible",
    "annotation",
    "is_token",
    "is_invisible",
    "show_badge",
    "is_locked",
    "default_edit_access",
    "default_movement_access",
    "default_vision_access",
    "asset",
] as const;
export const BaseAuraStrings = ["vision_source", "visible", "name", "value", "dim", "colour"] as const;
export const BaseTrackerStrings = ["visible", "name", "value", "maxvalue"] as const;
export type BaseAuraTemplate = Pick<ServerAura, typeof BaseAuraStrings[number]>;
export type BaseTrackerTemplate = Pick<ServerTracker, typeof BaseTrackerStrings[number]>;
export type BasePropertyTemplate = Pick<ServerShape, typeof BaseTemplateStrings[number]>;
export type BaseTemplate = Partial<
    BasePropertyTemplate & { auras: Partial<BaseAuraTemplate>[] } & { trackers: Partial<BaseTrackerTemplate>[] }
>;
// type FORBIDDEN_TEMPLATE_KEYS =
//     | "uuid"
//     | "x"
//     | "y"
//     | "floor"
//     | "layer"
//     | "draw_operator"
//     | "trackers"
//     | "auras"
//     | "labels"
//     | "owners"
//     | "options"
//     | "badge";
// export type ShapeTemplateBase = Omit<ServerShape, FORBIDDEN_TEMPLATE_KEYS>;

export const RectTemplateStrings = ["width", "height"] as const;
export type RectTemplate = Pick<ServerRect, typeof RectTemplateStrings[number]>;

export const CircleTemplateStrings = ["radius"] as const;
export type CircleTemplate = Pick<ServerCircle, typeof CircleTemplateStrings[number]>;

export const CircularTokenTemplateStrings = ["radius", "text", "font"] as const;
export type CircularTokenTemplate = Pick<ServerCircularToken, typeof CircularTokenTemplateStrings[number]>;

export const LineTemplateStrings = ["x", "y", "x2", "y2", "line_width"] as const;
export type LineTemplate = Pick<ServerLine, typeof LineTemplateStrings[number]>;

export const PolygonTemplateStrings = ["x", "y", "vertices", "open_polygon", "line_width"] as const;
export type PolygonTemplate = Pick<ServerPolygon, typeof PolygonTemplateStrings[number]>;

export const TextTemplateStrings = ["text", "font"] as const;
export type TextTemplate = Pick<ServerText, typeof TextTemplateStrings[number]>;

export const AssetTemplateStrings = ["width", "height", "src"] as const;
export type AssetTemplate = Pick<ServerAsset, typeof AssetTemplateStrings[number]>;

type SpecifcShapeTemplateStrings =
    | typeof AssetTemplateStrings
    | typeof PolygonTemplateStrings
    | typeof TextTemplateStrings;

type SpecificShapeTemplate =
    | AssetTemplate
    | CircleTemplate
    | CircularTokenTemplate
    | LineTemplate
    | RectTemplate
    | TextTemplate
    | PolygonTemplate;

export type ShapeTemplate = BasePropertyTemplate & SpecificShapeTemplate;

const TEMPLATE_TYPES: Record<SHAPE_TYPE, SpecifcShapeTemplateStrings> = {
    assetrect: AssetTemplateStrings,
    text: TextTemplateStrings,
    circle: TextTemplateStrings,
    circulartoken: TextTemplateStrings,
    polygon: PolygonTemplateStrings,
    line: TextTemplateStrings,
    rect: TextTemplateStrings,
};

export function getTemplateKeys(shapeType: SHAPE_TYPE): SpecifcShapeTemplateStrings {
    return TEMPLATE_TYPES[shapeType];
}
