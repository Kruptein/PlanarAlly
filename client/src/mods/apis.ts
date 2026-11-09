import { markRaw, shallowReactive } from "vue";

// Keyed by mod tag, so consumers keep working when the providing mod is updated or hot reloaded.
// The map itself is reactive so lookups in a computed/watch update when a mod (un)loads,
// the provided apis are not made reactive.
const modApis = shallowReactive(new Map<string, object>());

export function provideModApi(tag: string, api: object): () => void {
    const entry = markRaw(api);
    modApis.set(tag, entry);
    return () => {
        if (modApis.get(tag) === entry) modApis.delete(tag);
    };
}

// oxlint-disable-next-line typescript/no-unnecessary-type-parameters
export function getModApi<T extends object = Record<string, unknown>>(tag: string): T | undefined {
    return modApis.get(tag) as T | undefined;
}
