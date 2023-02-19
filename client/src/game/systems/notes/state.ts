import type { ApiNote } from "../../../apiTypes";
import { buildState } from "../state";

interface NoteState {
    notes: ApiNote[];
}

const state = buildState<NoteState>({
    notes: [],
});

export const noteState = {
    ...state,
};
