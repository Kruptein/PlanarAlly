import type { ApiAura, ApiShape, ApiTracker } from "../../apiTypes";
import type { SHAPE_TYPE } from "../shapes/types";

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
    "default_edit_access",
    "default_movement_access",
    "default_vision_access",
    "asset",
] as const;
// Some properties are not desirable by default:
// is_door, is_teleport_zone, is_locked, is_defeated, show_badge, is_invisible
// ideally we have an advanced option where you can decide which template options are saved including the above by default deselected
export const BaseAuraStrings = [
    "vision_source",
    "visible",
    "name",
    "value",
    "dim",
    "colour",
    "active",
    "border_colour",
    "angle",
    "direction",
] as const;
export const BaseTrackerStrings = [
    "visible",
    "name",
    "value",
    "maxvalue",
    "draw",
    "primary_color",
    "secondary_color",
] as const;
export type BaseAuraTemplate = Pick<ApiAura, (typeof BaseAuraStrings)[number]>;
export type BaseTrackerTemplate = Pick<ApiTracker, (typeof BaseTrackerStrings)[number]>;
type BasePropertyTemplate = Pick<ApiShape, (typeof BaseTemplateStrings)[number]>;
export type BaseTemplate = Partial<
    BasePropertyTemplate & { options?: string } & { auras: Partial<BaseAuraTemplate>[] } & {
        trackers: Partial<BaseTrackerTemplate>[];
    }
>;

// Why do these exist, templates only work for Assets at the moment?
const PolygonTemplateStrings = ["x", "y", "vertices", "open_polygon", "line_width"] as const;
const TextTemplateStrings = ["text", "font"] as const;

const AssetTemplateStrings = ["width", "height", "src"] as const;

type SpecifcShapeTemplateStrings =
    | typeof AssetTemplateStrings
    | typeof PolygonTemplateStrings
    | typeof TextTemplateStrings;

const TEMPLATE_TYPES: Record<SHAPE_TYPE, SpecifcShapeTemplateStrings> = {
    assetrect: AssetTemplateStrings,
    text: TextTemplateStrings,
    circle: TextTemplateStrings,
    circulartoken: TextTemplateStrings,
    fontawesome: AssetTemplateStrings,
    polygon: PolygonTemplateStrings,
    line: TextTemplateStrings,
    rect: TextTemplateStrings,
    togglecomposite: TextTemplateStrings,
};

export function getTemplateKeys(shapeType: SHAPE_TYPE): SpecifcShapeTemplateStrings {
    if (shapeType !== "assetrect") {
        console.error("Template keys requested for non-assetrect");
    }
    return TEMPLATE_TYPES[shapeType];
}
