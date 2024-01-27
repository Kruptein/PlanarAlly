import type { ApiNote } from "../../../apiTypes";
import type { DistributiveOmit } from "../../../core/types";

export type ClientNote = DistributiveOmit<ApiNote, "tags"> & {
    tags: { name: string; colour: string }[];
};

export enum NoteManagerMode {
    AttachShape,
    Create,
    Edit,
    List,
    Map,
}
