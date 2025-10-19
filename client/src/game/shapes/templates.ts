import type { ApiShape } from "../../apiTypes";
import type { ShapeOptions } from "../models/shapes";
import { BaseAuraStrings, BaseTemplateStrings, BaseTrackerStrings, getTemplateKeys } from "../models/templates";
import type { BaseAuraTemplate, BaseTemplate, BaseTrackerTemplate } from "../models/templates";

import type { SHAPE_TYPE } from "./types";

export function toTemplate(shape: ApiShape): BaseTemplate {
    const template: BaseTemplate = {};
    // should be template[key], but this is something that TS cannot correctly infer (issue #31445)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    for (const key of BaseTemplateStrings) (template as any)[key] = shape[key];

    // We usually don't want to save the options that are currently stored on the shape
    // there are some options however that SHOULD transfer. (currently only notes)
    if (shape.options) {
        const options: Partial<ShapeOptions> = {};
        const { templateNoteIds } = Object.fromEntries(JSON.parse(shape.options) as any[]) as Partial<ShapeOptions>;
        if (templateNoteIds) {
            options.templateNoteIds = templateNoteIds;
        }
        if (Object.keys(options).length > 0) {
            template.options = JSON.stringify(Object.entries(options));
        }
    }

    template.auras = [];
    template.trackers = [];
    for (const aura of shape.auras) {
        const templateAura: Partial<BaseAuraTemplate> = {};
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        for (const key of BaseAuraStrings) (templateAura as any)[key] = aura[key];
        template.auras.push(templateAura);
    }
    for (const tracker of shape.trackers) {
        const templateTracker: Partial<BaseTrackerTemplate> = {};
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        for (const key of BaseTrackerStrings) (templateTracker as any)[key] = tracker[key];
        template.trackers.push(templateTracker);
    }

    // Shape specific keys
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    for (const key of getTemplateKeys(shape.type_ as SHAPE_TYPE)) (template as any)[key] = (shape as any)[key];

    return template;
}
