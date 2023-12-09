import { buildState } from "../state";

import type { ClientNote } from "./types";

interface ReactiveNoteState {
    // manager UI
    managerOpen: boolean;
    managerMode: "list" | "edit" | "map";
    currentNote: string | undefined;

    notes: Map<string, ClientNote>;
}

const state = buildState<ReactiveNoteState>({
    managerOpen: false,
    managerMode: "list",
    currentNote: undefined,

    notes: new Map(),
});

export const noteState = {
    ...state,
};
