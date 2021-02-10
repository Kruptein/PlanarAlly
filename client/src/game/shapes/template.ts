import { aurasToServer } from "../models/conversion/aura";
import { ServerRect, ServerShape } from "../models/shapes";
import {
    BaseAuraStrings,
    BaseAuraTemplate,
    BaseTemplate,
    BaseTemplateStrings,
    BaseTrackerStrings,
    BaseTrackerTemplate,
    getTemplateKeys,
} from "../models/templates";
import { gameSettingsStore } from "../settings";

import { createEmptyAura, createEmptyTracker } from "./trackers/empty";

export function applyTemplate<T extends ServerShape>(shape: T, template: BaseTemplate): T {
    // should be shape[key], but this is something that TS cannot correctly infer (issue #31445)
    for (const key of BaseTemplateStrings) {
        if (key in template) (shape as any)[key] = template[key];
    }

    for (const trackerTemplate of template.trackers ?? []) {
        const defaultTracker = createEmptyTracker();
        shape.trackers.push({ ...defaultTracker, ...trackerTemplate });
    }

    for (const auraTemplate of template.auras ?? []) {
        const defaultAura = aurasToServer(shape.uuid, [createEmptyAura()])[0];
        shape.auras.push({ ...defaultAura, ...auraTemplate });
    }

    const gridRescale = 5 / gameSettingsStore.unitSize;

    // Shape specific keys
    for (const key of getTemplateKeys(shape.type_)) {
        if (["assetrect", "rect"].includes(shape.type_)) {
            const rect = (shape as any) as ServerRect;
            const rectTemplate = (template as any) as ServerRect;

            if (key === "width") {
                rect.width = rectTemplate.width * gridRescale;
            } else if (key === "height") {
                rect.height = rectTemplate.height * gridRescale;
            }
        } else {
            if (key in template) (shape as any)[key] = (template as any)[key];
        }
    }

    return shape;
}

export function toTemplate(shape: ServerShape): BaseTemplate {
    const template: BaseTemplate = {};
    // should be template[key], but this is something that TS cannot correctly infer (issue #31445)
    for (const key of BaseTemplateStrings) (template as any)[key] = shape[key];

    template.auras = [];
    template.trackers = [];
    for (const aura of shape.auras) {
        const templateAura: Partial<BaseAuraTemplate> = {};
        for (const key of BaseAuraStrings) (templateAura as any)[key] = aura[key];
        template.auras.push(templateAura);
    }
    for (const tracker of shape.trackers) {
        const templateTracker: Partial<BaseTrackerTemplate> = {};
        for (const key of BaseTrackerStrings) (templateTracker as any)[key] = tracker[key];
        template.trackers.push(templateTracker);
    }

    // Shape specific keys
    for (const key of getTemplateKeys(shape.type_)) (template as any)[key] = (shape as any)[key];

    return template;
}
