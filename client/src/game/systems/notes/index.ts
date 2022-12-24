import { registerSystem } from "..";
import type { System } from "..";

import { sendNewNote, sendRemoveNote, sendUpdateNote } from "./emits";
import type { Note } from "./models";
import { noteState } from "./state";

const { mutableReactive: $ } = noteState;

class NoteSystem implements System {
    clear(): void {
        $.notes = [];
    }

    newNote(note: Note, sync: boolean): void {
        $.notes.push(note);
        if (sync) sendNewNote(note);
    }

    updateNote(note: Note, sync: boolean): void {
        const actualNote = $.notes.find((n) => n.uuid === note.uuid);
        if (actualNote === undefined) return;
        actualNote.title = note.title;
        actualNote.text = note.text;
        if (sync) sendUpdateNote(note);
    }

    removeNote(note: Note, sync: boolean): void {
        $.notes = $.notes.filter((n) => n.uuid !== note.uuid);
        if (sync) sendRemoveNote(note.uuid);
    }
}

export const noteSystem = new NoteSystem();
registerSystem("notes", noteSystem, false, noteState);
