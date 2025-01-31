import type { DeepReadonly } from "vue";

import type { ApiNote } from "../../../apiTypes";
import { Vector, addP, toGP } from "../../../core/geometry";
import type { LocalId } from "../../../core/id";
import { filter } from "../../../core/iter";
import type { ShapeSystem } from "../../../core/systems";
import { registerSystem } from "../../../core/systems";
import { word2color } from "../../../core/utils";
import { getGlobalId, getLocalId, getShape } from "../../id";
import type { IAsset } from "../../interfaces/shapes/asset";
import { FontAwesomeIcon } from "../../shapes/variants/fontAwesomeIcon";

import {
    sendAddNoteTag,
    sendNewNote,
    sendNoteAccessAdd,
    sendNoteAccessEdit,
    sendNoteAccessRemove,
    sendNoteAddShape,
    sendNoteRemoveShape,
    sendNoteSetShowIconOnShape,
    sendNoteSetShowOnHover,
    sendRemoveNote,
    sendRemoveNoteTag,
    sendSetNoteText,
    sendSetNoteTitle,
} from "./emits";
import { noteState } from "./state";
import { NoteManagerMode, type ClientNote } from "./types";
import { closeNoteManager } from "./ui";

const { mutableReactive: $, raw, readonly, mutable } = noteState;

class NoteSystem implements ShapeSystem {
    inform(id: LocalId): void {
        if (raw.shapeNotes.has1(id)) return;

        const gid = getGlobalId(id);
        if (gid === undefined) return;

        const shapeNotes = filter(raw.notes.values(), (n) => n.shapes.includes(gid));
        for (const note of shapeNotes) {
            noteSystem.hookupShape(note, id);
        }
    }

    drop(id: LocalId): void {
        if (!raw.shapeNotes.has1(id)) return;
        $.shapeNotes.delete1(id);
    }

    clear(): void {
        closeNoteManager();
        $.notes.clear();
        $.shapeNotes.clear();
        $.currentNote = undefined;
        $.managerMode = NoteManagerMode.List;
    }

    async newNote(apiNote: ApiNote, sync: boolean): Promise<void> {
        const tags = await Promise.all(apiNote.tags.map(async (tag) => ({ name: tag, colour: await word2color(tag) })));
        const note = { ...apiNote, tags };
        $.notes.set(apiNote.uuid, note);

        // This section should only run if the note comes from the remote
        // as a newly created shape locally should never have a shape already attached
        // it should be attached with a separate call
        for (const shape of apiNote.shapes) {
            const shapeId = getLocalId(shape, false);
            if (shapeId === undefined) continue;
            this.hookupShape(note, shapeId);
        }
        if (sync) sendNewNote(apiNote);
    }

    setTitle(noteId: string, title: string, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        note.title = title;
        if (sync) {
            sendSetNoteTitle({
                uuid: noteId,
                value: title,
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
                value: text,
            });
        } else if (syncAfterDelay) {
            mutable.syncTimeouts.set(
                noteId,
                window.setTimeout(() => {
                    mutable.syncTimeouts.delete(noteId);
                    sendSetNoteText({
                        uuid: noteId,
                        value: text,
                    });
                }, 5_000),
            );
        }

        note.text = text;
    }

    attachShape(noteId: string, shape: LocalId, sync: boolean): void {
        const globalId = getGlobalId(shape);
        if (globalId === undefined) {
            console.error("Tried to attach a note to a local-only shape");
            return;
        }

        const note = $.notes.get(noteId);
        if (note === undefined) {
            console.error("Tried to attach a shape to a non-existent note");
            return;
        }
        if (!note.shapes.includes(globalId)) {
            note.shapes.push(globalId);
        } else {
            console.error("Tried to attach a shape to a note twice");
            return;
        }

        this.hookupShape(note, shape);

        if (sync) {
            sendNoteAddShape({ note_id: noteId, shape_id: globalId });
        }
    }

    // This is a utlity function used during loading of notes
    hookupShape(note: DeepReadonly<ClientNote>, shape: LocalId): void {
        $.shapeNotes.add(shape, note.uuid);
        if (note.showIconOnShape) this.createNoteIcon(shape, note.uuid);
    }

    removeShape(noteId: string, shapeId: LocalId, sync: boolean): void {
        const globalId = getGlobalId(shapeId);
        if (globalId === undefined) {
            console.error("Tried to remove a note from a local-only shape???");
            return;
        }

        const note = $.notes.get(noteId);
        if (note === undefined) {
            console.error("Tried to attach a shape to a non-existent note");
            return;
        }
        if (note.shapes.includes(globalId)) {
            note.shapes = note.shapes.filter((n) => n !== globalId);
        } else {
            console.error("Tried to remove a shape from a note it's not linked to??");
            return;
        }

        $.shapeNotes.deletePair(shapeId, noteId);

        if (note.showIconOnShape) {
            for (const iconShape of readonly.iconShapes.get(noteId) ?? []) {
                const shape = getShape(iconShape);
                if (shape?.layer === undefined || shape._parentId !== shapeId) continue;
                const parent = getShape(shape._parentId);
                if (parent) parent.removeDependentShape(shape.id, { dropShapeId: true });
                mutable.iconShapes.set(noteId, mutable.iconShapes.get(noteId)?.filter((id) => id !== shape.id) ?? []);
            }
        }

        if (sync) {
            sendNoteRemoveShape({ note_id: noteId, shape_id: globalId });
        }
    }

    async addTag(noteId: string, tag: string, sync: boolean): Promise<void> {
        const note = $.notes.get(noteId);
        if (note === undefined) return;
        note.tags.push({ name: tag, colour: await word2color(tag) });
        if (sync) {
            sendAddNoteTag({
                uuid: noteId,
                value: tag,
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
                value: tagName,
            });
        }
    }

    removeNote(noteId: string, sync: boolean): void {
        const note = raw.notes.get(noteId);
        if (note === undefined) return;
        if (raw.currentNote === noteId) $.currentNote = undefined;
        $.shapeNotes.delete2(noteId);
        if (note.showIconOnShape) {
            for (const iconShape of readonly.iconShapes.get(noteId) ?? []) {
                const shape = getShape(iconShape);
                if (shape?.layer === undefined) continue;
                if (shape.parentId === undefined) continue;
                const parent = getShape(shape.parentId);
                if (parent) parent.removeDependentShape(shape.id, { dropShapeId: true });
                mutable.iconShapes.set(noteId, mutable.iconShapes.get(noteId)?.filter((id) => id !== shape.id) ?? []);
            }
        }
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
            sendNoteAccessRemove({ uuid: noteId, value: userName });
        }
    }

    setShowOnHover(noteId: string, showOnHover: boolean, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;

        note.showOnHover = showOnHover;
        if (sync) {
            sendNoteSetShowOnHover({ uuid: noteId, value: showOnHover });
        }
    }

    setShowIconOnShape(noteId: string, showIconOnShape: boolean, sync: boolean): void {
        const note = $.notes.get(noteId);
        if (note === undefined) return;

        note.showIconOnShape = showIconOnShape;

        if (note.showIconOnShape) {
            for (const shape of note.shapes) {
                const shapeId = getLocalId(shape, false);
                if (shapeId === undefined) continue;
                this.createNoteIcon(shapeId, noteId);
            }
        } else {
            for (const iconShape of readonly.iconShapes.get(noteId) ?? []) {
                const shape = getShape(iconShape);
                if (shape?.layer === undefined) continue;
                if (shape.parentId === undefined) continue;
                const parent = getShape(shape.parentId);
                if (parent) parent.removeDependentShape(shape.id, { dropShapeId: true });
            }
            mutable.iconShapes.delete(noteId);
        }

        if (sync) {
            sendNoteSetShowIconOnShape({ uuid: noteId, value: showIconOnShape });
        }
    }

    private createNoteIcon(shapeId: LocalId, noteId: string): void {
        const icon = new FontAwesomeIcon({ prefix: "fas", iconName: "sticky-note" }, toGP(0, 0), 15, {
            parentId: shapeId,
        });
        const shape = getShape(shapeId);
        if (shape?.layer === undefined) return;
        shape.addDependentShape({
            shape: icon,
            render: (ctx, bbox, _depShape) => {
                const depShape = _depShape as IAsset;
                if (bbox.w <= bbox.h) {
                    depShape.resizeW(bbox.w * 0.35, true);
                } else {
                    depShape.resizeH(bbox.h * 0.35, true);
                }
                depShape.center = addP(bbox.botLeft, new Vector(depShape.w / 2, -depShape.h / 2));
                depShape.draw(ctx, false);
            },
        });
        if (readonly.iconShapes.has(noteId)) {
            mutable.iconShapes.get(noteId)?.push(icon.id);
        } else {
            mutable.iconShapes.set(noteId, [icon.id]);
        }
    }
}

export const noteSystem = new NoteSystem();
registerSystem("notes", noteSystem, true, noteState);
