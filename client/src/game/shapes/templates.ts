import type { ApiRectShape, ApiShape } from "../../apiTypes";
import { BaseAuraStrings, BaseTemplateStrings, BaseTrackerStrings, getTemplateKeys } from "../models/templates";
import type { BaseAuraTemplate, BaseTemplate, BaseTrackerTemplate } from "../models/templates";
import { aurasToServer } from "../systems/auras/conversion";
import { createEmptyAura } from "../systems/auras/utils";
import { locationSettingsState } from "../systems/settings/location/state";
import { trackersToServer } from "../systems/trackers/conversion";
import { createEmptyTracker } from "../systems/trackers/utils";

import type { SHAPE_TYPE } from "./types";

export function applyTemplate<T extends ApiShape>(shape: T, template: BaseTemplate & { options?: string }): T {
    // should be shape[key], but this is something that TS cannot correctly infer (issue #31445)
    for (const key of BaseTemplateStrings) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        if (key in template) (shape as any)[key] = template[key];
    }

    const uuid = shape.uuid;

    // Options are not to be copied to a template by default, which is why they're not part of BaseTemplate
    // Some custom things do add options to a template and they should be set accordingly
    if (template.options !== undefined) shape.options = template.options;

    for (const trackerTemplate of template.trackers ?? []) {
        const defaultTracker = trackersToServer(uuid, [createEmptyTracker()])[0]!;
        shape.trackers.push({ ...defaultTracker, ...trackerTemplate });
    }

    for (const auraTemplate of template.auras ?? []) {
        const defaultAura = aurasToServer(uuid, [createEmptyAura()])[0]!;
        shape.auras.push({ ...defaultAura, ...auraTemplate });
    }

    const gridRescale = 5 / locationSettingsState.raw.unitSize.value;

    // Shape specific keys
    for (const key of getTemplateKeys(shape.type_ as SHAPE_TYPE)) {
        if (["assetrect", "rect"].includes(shape.type_)) {
            const rect = shape as any as ApiRectShape;
            const rectTemplate = template as any as ApiRectShape;

            if (key === "width") {
                rect.width = rectTemplate.width * gridRescale;
            } else if (key === "height") {
                rect.height = rectTemplate.height * gridRescale;
            }
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            if (key in template) (shape as any)[key] = (template as any)[key];
        }
    }

    return shape;
}

export function toTemplate(shape: ApiShape): BaseTemplate {
    const template: BaseTemplate = {};
    // should be template[key], but this is something that TS cannot correctly infer (issue #31445)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    for (const key of BaseTemplateStrings) (template as any)[key] = shape.core[key];

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
