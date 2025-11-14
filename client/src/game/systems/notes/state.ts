import { computed } from "vue";

import { BiArrMap } from "../../../core/biArrMap";
import type { LocalId } from "../../../core/id";
import { buildState } from "../../../core/systems/state";
import { knownId } from "../../id";

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
    localShapeNotes: computed(
        () =>
            new BiArrMap(
                // temp-fix for vue iterator method breaking
                Iterator.from(state.reactive.shapeNotes.entries1())
                    .filter(([shapeId]) => knownId(shapeId))
                    .flatMap(([shapeId, notes]) => notes.map((noteId) => [noteId, shapeId])),
            ),
    ),
};
