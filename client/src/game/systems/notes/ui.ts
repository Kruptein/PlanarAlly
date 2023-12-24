import type { LocalId } from "../../id";
// eslint-disable-next-line import/default
import NoteDialog from "../../ui/notes/NoteDialog.vue";
// eslint-disable-next-line import/default
import NoteManager from "../../ui/notes/NoteManager.vue";
import { modalSystem } from "../modals";
import type { ModalIndex } from "../modals/types";

import { noteState } from "./state";
import { NoteManagerMode } from "./types";

let index = 0 as ModalIndex;

export function openNoteManager(mode: NoteManagerMode.Map): void;
export function openNoteManager(mode: NoteManagerMode.Edit, noteId: string): void;
export function openNoteManager(mode: NoteManagerMode.List, shapeId?: LocalId): void;
export function openNoteManager(mode: NoteManagerMode, extraId?: string | LocalId): void {
    noteState.mutableReactive.managerMode = mode;
    if (mode === NoteManagerMode.Edit) {
        noteState.mutableReactive.currentNote = extraId as string;
    } else if (mode === NoteManagerMode.List) {
        noteState.mutableReactive.shapeFilter = extraId as LocalId | undefined;
    }
    if (!noteState.raw.managerOpen) {
        index = modalSystem.addModal({ component: NoteManager });
        noteState.mutableReactive.managerOpen = true;
    }
}

export function toggleNoteManager(): void {
    if (noteState.raw.managerOpen) {
        modalSystem.close(index, true);
        noteState.mutableReactive.managerOpen = false;
    } else {
        openNoteManager(NoteManagerMode.List);
    }
}

export function popoutNote(noteId: string): void {
    modalSystem.addModal({
        component: NoteDialog,
        props: { uuid: noteId },
    });
}
