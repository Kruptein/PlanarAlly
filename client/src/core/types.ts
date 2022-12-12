export type PartialPick<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export type FunctionPropertyNames<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
