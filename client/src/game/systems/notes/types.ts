import type { ApiNote } from "../../../apiTypes";
import type { DistributiveOmit } from "../../../core/types";

export type NoteTag = {
    name: string;
    colour: string;
};

export type ClientNote = DistributiveOmit<ApiNote, "tags"> & {
    tags: NoteTag[];
};

export enum NoteManagerMode {
    AttachShape,
    Create,
    Edit,
    List,
    Map,
}
