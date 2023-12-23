import { registerSystem } from "..";
import type { System } from "..";
import type { ApiNote } from "../../../apiTypes";
import { word2color } from "../../../core/utils";
import { getGlobalId, type LocalId } from "../../id";

import {
    sendAddNoteTag,
    sendNewNote,
    sendNoteAccessAdd,
    sendNoteAccessEdit,
    sendNoteAccessRemove,
    sendNoteAddShape,
    sendRemoveNote,
    sendRemoveNoteTag,
    sendSetNoteText,
    sendSetNoteTitle,
} from "./emits";
import { noteState } from "./state";

const { mutableReactive: $, raw, readonly, mutable } = noteState;

class NoteSystem implements System {
    clear(): void {
        $.notes.clear();
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

    setText(noteId: string, text: string, sync: boolean, syncAfterDelay: boolean = false): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;

        // Ensure any existing timeout is cleared,
        // so that we don't override a sync with a stale value
        const timeoutId = readonly.syncTimeouts.get(noteId);
        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId);
            mutable.syncTimeouts.delete(noteId);
        }

        // If there was a timeout ongoing, flush it immediately
        // otherwise only flush if the text actually changed
        if (sync && (timeoutId !== undefined || note.text !== text)) {
            sendSetNoteText({
                uuid: noteId,
                text,
            });
        } else if (syncAfterDelay) {
            mutable.syncTimeouts.set(
                noteId,
                window.setTimeout(() => {
                    mutable.syncTimeouts.delete(noteId);
                    sendSetNoteText({
                        uuid: noteId,
                        text,
                    });
                }, 5_000),
            );
        }

        note.text = text;
    }

    attachShape(noteId: string, shape: LocalId, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) {
            console.error("Tried to attach a shape to a non-existent note");
            return;
        }
        const globalId = getGlobalId(shape);
        if (globalId === undefined) {
            console.error("Tried to attach a note to a local-only shape");
            return;
        }

        note.shapes.push(globalId);
        if (!raw.shapeNotes.has(shape)) $.shapeNotes.set(shape, []);
        $.shapeNotes.get(shape)?.push(noteId);

        if (sync) {
            sendNoteAddShape({ note_id: noteId, shape_id: globalId });
        }
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
