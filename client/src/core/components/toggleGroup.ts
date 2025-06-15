export function arrToToggleGroup<T extends string | number | symbol>(
    x: readonly T[],
    map: Record<T, string>,
): { label: string; value: T }[];
export function arrToToggleGroup(x: readonly string[]): { label: string; value: string }[];
export function arrToToggleGroup<T extends string | number | symbol>(
    x: readonly T[],
    map?: Record<T, string>,
): { label: string; value: T }[] {
    return x.map((item) => ({ label: map?.[item] ?? item, value: item }) as { label: string; value: T });
}
