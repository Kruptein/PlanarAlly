import { buildState } from "../state";

import type { ClientNote } from "./types";

interface ReactiveNoteState {
    // manager UI
    managerOpen: boolean;
    managerMode: "list" | "edit" | "map";
    currentNote: string | undefined;

    notes: Map<string, ClientNote>;
}

interface NonReactiveNoteState {
    syncTimeouts: Map<string, number>;
}

const state = buildState<ReactiveNoteState, NonReactiveNoteState>(
    {
        managerOpen: false,
        managerMode: "list",
        currentNote: undefined,

        notes: new Map(),
    },
    { syncTimeouts: new Map() },
);

export const noteState = {
    ...state,
};
