import type { Label } from "../../shapes/interfaces";
import { wrapSocket } from "../helpers";

export const sendLabelVisibility = wrapSocket<{ uuid: string; visible: boolean }>("Label.Visibility.Set");
export const sendLabelDelete = wrapSocket<{ uuid: string }>("Label.Delete");
export const sendLabelAdd = wrapSocket<Label>("Label.Add");

export const sendLabelFilterDelete = wrapSocket<string>("Labels.Filter.Remove");
export const sendLabelFilterAdd = wrapSocket<string>("Labels.Filter.Add");
