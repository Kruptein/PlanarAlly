import { socket } from "../../api/socket";

import type { Note } from "./models";

import { noteSystem } from ".";

socket.on("Notes.Set", (notes: Note[]) => {
    for (const note of notes) noteSystem.newNote(note, false);
});
