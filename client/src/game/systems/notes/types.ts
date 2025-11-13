import type { ApiNote } from "../../../apiTypes";
import type { LocalId, StringId } from "../../../core/id";
import type { DistributiveOmit } from "../../../core/types";

export type NoteId = StringId<"NoteId">;

export type NoteTag = {
    name: string;
    colour: string;
};

export type ClientNote = DistributiveOmit<ApiNote, "tags" | "shapes"> & {
    shapes: LocalId[];
    tags: NoteTag[];
};

export enum NoteManagerMode {
    AttachShape,
    Create,
    Edit,
    List,
    Map,
}

export const NO_FILTER = Symbol("NO_FILTER");
export const ACTIVE_FILTER = Symbol("ACTIVE_FILTER");
export const NO_LINK_FILTER = Symbol("NO_LINK_FILTER");
