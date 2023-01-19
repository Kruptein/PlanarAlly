import type { ApiLabel } from "../../../apiTypes";
import { wrapSocket } from "../../api/helpers";

export const sendLabelVisibility = wrapSocket<{ uuid: string; visible: boolean }>("Label.Visibility.Set");
export const sendLabelDelete = wrapSocket<{ uuid: string }>("Label.Delete");
export const sendLabelAdd = wrapSocket<ApiLabel>("Label.Add");

export const sendLabelFilterDelete = wrapSocket<string>("Labels.Filter.Remove");
export const sendLabelFilterAdd = wrapSocket<string>("Labels.Filter.Add");
