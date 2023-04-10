import type { SyncMode } from "../../../../core/models/types";
import type { IShape } from "../shape";

export interface IText extends IShape {
    fontSize: number;
    text: string;

    setText: (text: string, sync: SyncMode) => void;
}
