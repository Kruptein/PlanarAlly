import type {
    ApiNoteAccessEdit,
    ApiNote,
    ApiNoteSetBoolean,
    ApiNoteSetString,
    ApiNoteShape,
    ApiNoteRoomLink,
} from "../../../apiTypes";
import { wrapSocket } from "../../api/socket";

export const sendNewNote = wrapSocket<ApiNote>("Note.New");
export const sendRemoveNote = wrapSocket<string>("Note.Remove");
export const sendSetNoteTitle = wrapSocket<ApiNoteSetString>("Note.Title.Set");
export const sendSetNoteText = wrapSocket<ApiNoteSetString>("Note.Text.Set");
export const sendAddNoteTag = wrapSocket<ApiNoteSetString>("Note.Tag.Add");
export const sendRemoveNoteTag = wrapSocket<ApiNoteSetString>("Note.Tag.Remove");
export const sendNoteAccessAdd = wrapSocket<ApiNoteAccessEdit>("Note.Access.Add");
export const sendNoteAccessEdit = wrapSocket<ApiNoteAccessEdit>("Note.Access.Edit");
export const sendNoteAccessRemove = wrapSocket<ApiNoteSetString>("Note.Access.Remove");
export const sendNoteAddShape = wrapSocket<ApiNoteShape>("Note.Shape.Add");
export const sendNoteRemoveShape = wrapSocket<ApiNoteShape>("Note.Shape.Remove");
export const sendNoteSetShowOnHover = wrapSocket<ApiNoteSetBoolean>("Note.ShowOnHover.Set");
export const sendNoteSetShowIconOnShape = wrapSocket<ApiNoteSetBoolean>("Note.ShowIconOnShape.Set");
export const sendNoteRoomLink = wrapSocket<ApiNoteRoomLink>("Note.Room.Link");
export const sendNoteRoomUnlink = wrapSocket<ApiNoteRoomLink>("Note.Room.Unlink");
