import type { Note } from "../../models/general";
import { wrapSocket } from "../helpers";

export const sendNewNote = wrapSocket<Note>("Note.New");
export const sendUpdateNote = wrapSocket<Note>("Note.Update");
export const sendRemoveNote = wrapSocket<string>("Note.Remove");
