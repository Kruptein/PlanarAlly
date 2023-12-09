import type { ApiNote, ApiNoteSetText, ApiNoteSetTitle, ApiNoteTag } from "../../../apiTypes";
import { socket } from "../../api/socket";

import { noteSystem } from ".";

socket.on("Notes.Set", async (notes: ApiNote[]) => {
    for (const note of notes) await noteSystem.newNote(note, false);
});

socket.on("Note.Remove", (data: string) => noteSystem.removeNote(data, false));

socket.on("Note.Title.Set", (data: ApiNoteSetTitle) => {
    noteSystem.setTitle(data.uuid, data.title, false);
});

socket.on("Note.Text.Set", (data: ApiNoteSetText) => {
    noteSystem.setText(data.uuid, data.text, false);
});

socket.on("Note.Tag.Add", async (data: ApiNoteTag) => {
    await noteSystem.addTag(data.uuid, data.tag, false);
});

socket.on("Note.Tag.Remove", (data: ApiNoteTag) => {
    noteSystem.removeTag(data.uuid, data.tag, false);
});
