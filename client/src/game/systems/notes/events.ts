import type { ApiNote } from "../../../apiTypes";
import { socket } from "../../api/socket";

import { noteSystem } from ".";

socket.on("Notes.Set", (notes: ApiNote[]) => {
    for (const note of notes) noteSystem.newNote(note, false);
});
