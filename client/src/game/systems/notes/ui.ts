import type { LocalId } from "../../../core/id";
// eslint-disable-next-line import/default
import NoteDialog from "../../ui/notes/NoteDialog.vue";
import { modalSystem } from "../modals";

import { noteState } from "./state";
import type { NoteId } from "./types";
import { NoteManagerMode } from "./types";

export function openNoteManager(mode: NoteManagerMode.Map): void;
export function openNoteManager(mode: NoteManagerMode.Edit, noteId: NoteId): void;
export function openNoteManager(mode: NoteManagerMode.List, shapeId?: LocalId): void;
export function openNoteManager(mode: NoteManagerMode, extraId?: string | LocalId): void {
    noteState.mutableReactive.managerMode = mode;
    if (mode === NoteManagerMode.Edit) {
        noteState.mutableReactive.currentNote = extraId as NoteId;
    } else if (mode === NoteManagerMode.List) {
        noteState.mutableReactive.shapeFilter = extraId as LocalId | undefined;
    }
    showNoteManager();
}

export function closeNoteManager(): void {
    if (noteState.raw.managerOpen) {
        noteState.mutableReactive.managerOpen = false;
    }
}

function showNoteManager(): void {
    if (!noteState.raw.managerOpen) {
        noteState.mutableReactive.managerOpen = true;
    }
}

export function toggleNoteManager(): void {
    if (noteState.raw.managerOpen) {
        closeNoteManager();
    } else {
        showNoteManager();
    }
}

export function editNote(noteId: NoteId): void {
    openNoteManager(NoteManagerMode.Edit, noteId);
}

export function popoutNote(noteId: NoteId): void {
    modalSystem.addModal({
        component: NoteDialog,
        props: { uuid: noteId },
    });
}
