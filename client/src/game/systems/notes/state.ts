import { buildState } from "../state";

import type { Note } from "./models";

interface NoteState {
    notes: Note[];
}

const state = buildState<NoteState>({
    notes: [],
});

export const noteState = {
    ...state,
};
