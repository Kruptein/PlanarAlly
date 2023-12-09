import type { ApiNote, ApiNoteSetText, ApiNoteSetTitle, ApiNoteTag } from "../../../apiTypes";
import { wrapSocket } from "../../api/helpers";

export const sendNewNote = wrapSocket<ApiNote>("Note.New");
export const sendRemoveNote = wrapSocket<string>("Note.Remove");
export const sendSetNoteTitle = wrapSocket<ApiNoteSetTitle>("Note.Title.Set");
export const sendSetNoteText = wrapSocket<ApiNoteSetText>("Note.Text.Set");
export const sendAddNoteTag = wrapSocket<ApiNoteTag>("Note.Tag.Add");
export const sendRemoveNoteTag = wrapSocket<ApiNoteTag>("Note.Tag.Remove");
