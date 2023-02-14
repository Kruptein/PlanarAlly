export type PartialPick<T, K extends keyof T> = Partial<T> & Pick<T, K>;
