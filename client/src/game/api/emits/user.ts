import { wrapSocket } from "../socket";

export const sendColourHistoryChanged = wrapSocket<string>("User.ColourHistory.Set");
