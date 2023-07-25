import type { ApiDataBlock } from "../../apiTypes";

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type DbRepr = DistributiveOmit<ApiDataBlock, "data">;

export type DBR = Record<string, unknown>;

export interface DataBlockSerializer<T extends DBR, Y extends DBR> {
    serialize: { [key in keyof T & keyof Y]: (data: T[key]) => Y[key] };
    deserialize: { [key in keyof T & keyof Y]: (data: Y[key]) => T[key] };
}
