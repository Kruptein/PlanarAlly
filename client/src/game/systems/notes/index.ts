import { registerSystem } from "..";
import type { System } from "..";
import type { ApiNote } from "../../../apiTypes";
import { word2color } from "../../../core/utils";
import type { GlobalId } from "../../id";
// eslint-disable-next-line import/default
import NoteManager from "../../ui/notes/NoteManager.vue";
import { modalSystem } from "../modals";
import type { ModalIndex } from "../modals/types";

import {
    sendAddNoteTag,
    sendNewNote,
    sendNoteAccessAdd,
    sendNoteAccessEdit,
    sendNoteAccessRemove,
    sendRemoveNote,
    sendRemoveNoteTag,
    sendSetNoteText,
    sendSetNoteTitle,
} from "./emits";
import { noteState } from "./state";

const { mutableReactive: $ } = noteState;

let index = 0 as ModalIndex;

class NoteSystem implements System {
    clear(): void {
        $.notes.clear();
    }

    toggleManager(): void {
        if (noteState.raw.managerOpen) {
            modalSystem.close(index, true);
        } else {
            index = modalSystem.addModal({ component: NoteManager });
        }
        $.managerOpen = !noteState.raw.managerOpen;
    }

    async newNote(note: ApiNote, sync: boolean): Promise<void> {
        const tags = await Promise.all(note.tags.map(async (tag) => ({ name: tag, colour: await word2color(tag) })));
        $.notes.set(note.uuid, { ...note, tags });
        if (sync) sendNewNote(note);
    }

    setTitle(noteId: string, title: string, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        note.title = title;
        if (sync) {
            sendSetNoteTitle({
                uuid: noteId,
                title,
            });
        }
    }

    setText(noteId: string, text: string, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        note.text = text;
        if (sync) {
            sendSetNoteText({
                uuid: noteId,
                text,
            });
        }
    }

    attachShape(noteId: string, shape: GlobalId): void {
        const note = $.notes.get(noteId);
        if (note === undefined || note.kind === "campaign") return;
        note.shape = shape;
    }

    async addTag(noteId: string, tag: string, sync: boolean): Promise<void> {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        note.tags.push({ name: tag, colour: await word2color(tag) });
        if (sync) {
            sendAddNoteTag({
                uuid: noteId,
                tag,
            });
        }
    }

    removeTag(noteId: string, tagName: string, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        note.tags = note.tags.filter((tag) => tag.name !== tagName);
        if (sync) {
            sendRemoveNoteTag({
                uuid: noteId,
                tag: tagName,
            });
        }
    }

    removeNote(noteId: string, sync: boolean): void {
        $.notes.delete(noteId);
        if (sync) sendRemoveNote(noteId);
    }

    addAccess(noteId: string, userName: string, access: { can_view: boolean; can_edit: boolean }, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        const a = note.access.findIndex((a) => a.name === userName);
        if (a >= 0) {
            throw new Error(`Duplicate NoteAccess entry ${noteId}-${userName}`);
        }
        const newAccess = { name: userName, can_edit: access.can_edit, can_view: access.can_view };
        note.access.push(newAccess);
        if (sync) {
            sendNoteAccessAdd({ ...newAccess, note: noteId });
        }
    }

    setAccess(noteId: string, userName: string, access: { can_view: boolean; can_edit: boolean }, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        const a = note.access.find((a) => a.name === userName);
        if (a === undefined) {
            if (userName === "default") return this.addAccess(noteId, userName, access, sync);
            throw new Error(`Unknown NoteAccess ${noteId}-${userName}`);
        }
        a.can_view = access.can_view;
        a.can_edit = access.can_edit;
        if (sync) {
            sendNoteAccessEdit({ ...a, note: noteId });
        }
    }

    removeAccess(noteId: string, userName: string, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        const a = note.access.findIndex((a) => a.name === userName);
        if (a < 0) {
            throw new Error(`Unknown NoteAccess ${noteId}-${userName}`);
        }
        note.access.splice(a, 1);
        if (sync) {
            sendNoteAccessRemove({ uuid: noteId, username: userName });
        }
    }
}

export const noteSystem = new NoteSystem();
registerSystem("notes", noteSystem, false, noteState);
