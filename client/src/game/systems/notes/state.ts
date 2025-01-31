import { BiArrMap } from "../../../core/biArrMap";
import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";

import { type ClientNote, NoteManagerMode } from "./types";

interface ReactiveNoteState {
    // manager UI
    managerOpen: boolean;
    managerMode: NoteManagerMode;
    currentNote: string | undefined;

    shapeFilter: LocalId | undefined;

    notes: Map<string, ClientNote>;
    shapeNotes: BiArrMap<LocalId, string>;
}

interface NonReactiveNoteState {
    syncTimeouts: Map<string, number>;
    iconShapes: Map<string, LocalId[]>;
}

const state = buildState<ReactiveNoteState, NonReactiveNoteState>(
    {
        managerOpen: false,
        managerMode: NoteManagerMode.List,
        currentNote: undefined,

        shapeFilter: undefined,

        notes: new Map(),
        shapeNotes: new BiArrMap(),
    },
    {
        iconShapes: new Map(),
        syncTimeouts: new Map(),
    },
);

export const noteState = {
    ...state,
};
