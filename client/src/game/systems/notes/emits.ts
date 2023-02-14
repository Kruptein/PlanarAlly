import { wrapSocket } from "../../api/helpers";

import type { Note } from "./models";

export const sendNewNote = wrapSocket<Note>("Note.New");
export const sendUpdateNote = wrapSocket<Note>("Note.Update");
export const sendRemoveNote = wrapSocket<string>("Note.Remove");
