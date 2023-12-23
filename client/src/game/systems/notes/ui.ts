// eslint-disable-next-line import/default
import NoteDialog from "../../ui/notes/NoteDialog.vue";
// eslint-disable-next-line import/default
import NoteManager from "../../ui/notes/NoteManager.vue";
import { modalSystem } from "../modals";
import type { ModalIndex } from "../modals/types";

import { noteState } from "./state";

let index = 0 as ModalIndex;

export function toggleNoteManager(): void {
    if (noteState.raw.managerOpen) {
        modalSystem.close(index, true);
    } else {
        index = modalSystem.addModal({ component: NoteManager });
    }
    noteState.mutableReactive.managerOpen = !noteState.raw.managerOpen;
}

export function popoutNote(noteId: string): void {
    modalSystem.addModal({
        component: NoteDialog,
        props: { uuid: noteId },
    });
}
