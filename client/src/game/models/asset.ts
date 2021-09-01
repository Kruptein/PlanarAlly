import type { BaseTemplate } from "./templates";

export interface AssetOptions {
    version: string;
    shape: string;
    templates: {
        [templateName: string]: BaseTemplate;
    };
}
