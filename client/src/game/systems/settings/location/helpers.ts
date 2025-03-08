import type { WithLocationDefault } from "./models";

export function isDefaultWrapper(
    x: number | boolean | WithLocationDefault<unknown>,
): x is WithLocationDefault<unknown> {
    if (typeof x === "number" || typeof x === "boolean") return false;
    return x.default !== undefined && x.location !== undefined;
}
