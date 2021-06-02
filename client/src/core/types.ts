export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type FunctionPropertyNames<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

// A helper function for an issue with typescript generic partials
// https://github.com/microsoft/TypeScript/issues/31675
export function getValueOrDefault<K extends keyof T, T>(obj: Partial<T> | undefined, key: K, defaultValue: T[K]): T[K] {
    return obj?.[key] ?? defaultValue;
}
