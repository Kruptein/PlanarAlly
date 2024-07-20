export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type PartialPick<T, K extends keyof T> = Partial<T> & Pick<T, K>;
