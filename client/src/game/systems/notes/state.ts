import { BiArrMap } from "../../../core/biArrMap";
import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";

import { type ClientNote, type NoteId, NoteManagerMode } from "./types";

interface ReactiveNoteState {
    // manager UI
    managerOpen: boolean;
    managerMode: NoteManagerMode;
    currentNote: NoteId | undefined;

    shapeFilter: LocalId | undefined;

    notes: Map<NoteId, ClientNote>;
    shapeNotes: BiArrMap<LocalId, NoteId>;
}

interface NonReactiveNoteState {
    syncTimeouts: Map<NoteId, number>;
    iconShapes: Map<NoteId, LocalId[]>;
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
