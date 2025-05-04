import type { ApiDataBlock } from "../../apiTypes";
import type { DistributiveOmit } from "../../core/types";

export type DbRepr = DistributiveOmit<ApiDataBlock, "data">;

export type DBR = Record<string, unknown> | unknown[];

export interface DataBlockSerializer<S extends DBR = never, D = S> {
    serialize: (data: D) => S;
    deserialize: (data: S) => D;
}
