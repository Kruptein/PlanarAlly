import type { WithLocationDefault } from "./models";

export function isDefaultWrapper(x: any): x is WithLocationDefault<unknown> {
    return x.default !== undefined && x.location !== undefined;
}
