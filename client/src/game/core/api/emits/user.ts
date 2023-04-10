import { wrapSocket } from "../helpers";

export const sendColourHistoryChanged = wrapSocket<string>("User.ColourHistory.Set");
