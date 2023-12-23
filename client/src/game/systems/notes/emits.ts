import type {
    ApiNoteAccessEdit,
    ApiNote,
    ApiNoteSetText,
    ApiNoteSetTitle,
    ApiNoteTag,
    ApiNoteAccessRemove,
    ApiNoteShape,
} from "../../../apiTypes";
import { wrapSocket } from "../../api/helpers";

export const sendNewNote = wrapSocket<ApiNote>("Note.New");
export const sendRemoveNote = wrapSocket<string>("Note.Remove");
export const sendSetNoteTitle = wrapSocket<ApiNoteSetTitle>("Note.Title.Set");
export const sendSetNoteText = wrapSocket<ApiNoteSetText>("Note.Text.Set");
export const sendAddNoteTag = wrapSocket<ApiNoteTag>("Note.Tag.Add");
export const sendRemoveNoteTag = wrapSocket<ApiNoteTag>("Note.Tag.Remove");
export const sendNoteAccessAdd = wrapSocket<ApiNoteAccessEdit>("Note.Access.Add");
export const sendNoteAccessEdit = wrapSocket<ApiNoteAccessEdit>("Note.Access.Edit");
export const sendNoteAccessRemove = wrapSocket<ApiNoteAccessRemove>("Note.Access.Remove");
export const sendNoteAddShape = wrapSocket<ApiNoteShape>("Note.Shape.Add");
