import type { ApiLabel, LabelVisibilitySet } from "../../../apiTypes";
import { wrapSocket } from "../../api/helpers";

export const sendLabelVisibility = wrapSocket<LabelVisibilitySet>("Label.Visibility.Set");
export const sendLabelDelete = wrapSocket<string>("Label.Delete");
export const sendLabelAdd = wrapSocket<ApiLabel>("Label.Add");

export const sendLabelFilterDelete = wrapSocket<string>("Labels.Filter.Remove");
export const sendLabelFilterAdd = wrapSocket<string>("Labels.Filter.Add");
