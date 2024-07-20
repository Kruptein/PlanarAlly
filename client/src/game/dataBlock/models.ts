import type { ApiDataBlock } from "../../apiTypes";
import type { DistributiveOmit } from "../../core/types";

export type DbRepr = DistributiveOmit<ApiDataBlock, "data">;

export type DBR = Record<string, unknown>;

export interface DataBlockSerializer<T extends DBR, Y extends DBR = T> {
    serialize?: { [key in keyof T & keyof Y]?: (data: T[key]) => Y[key] };
    deserialize?: { [key in keyof T & keyof Y]?: (data: Y[key]) => T[key] };
}
