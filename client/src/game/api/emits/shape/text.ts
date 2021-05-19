import { wrapSocket } from "../../helpers";

export const sendTextUpdate = wrapSocket<{ uuid: string; text: string; temporary: boolean }>("Shape.Text.Value.Set");
