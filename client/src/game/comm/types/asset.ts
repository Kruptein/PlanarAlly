import { BaseTemplate } from "./templates";

export interface AssetOptions {
    version: string;
    shape: string;
    variants: {
        [variantName: string]: { properties: BaseTemplate };
    };
}
