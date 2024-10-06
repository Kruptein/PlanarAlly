import type { WithLocationDefault } from "./models";

export function isDefaultWrapper(x: number | WithLocationDefault<unknown>): x is WithLocationDefault<unknown> {
    if (typeof x === "number") return false;
    return x.default !== undefined && x.location !== undefined;
}
