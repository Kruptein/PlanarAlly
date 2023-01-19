import type { ApiNote } from "../../../apiTypes";
import { wrapSocket } from "../../api/helpers";

export const sendNewNote = wrapSocket<ApiNote>("Note.New");
export const sendUpdateNote = wrapSocket<ApiNote>("Note.Update");
export const sendRemoveNote = wrapSocket<string>("Note.Remove");
