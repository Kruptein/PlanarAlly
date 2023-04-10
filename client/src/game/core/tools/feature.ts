import type { ToolFeatures } from "../models/tools";

export function hasFeature(feature: number, features: ToolFeatures): boolean {
    return (
        !(features.disabled?.includes(feature) ?? false) &&
        ((features.enabled?.length ?? 0) === 0 || (features.enabled?.includes(feature) ?? false))
    );
}
