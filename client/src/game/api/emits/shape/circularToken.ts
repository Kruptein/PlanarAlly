import { wrapSocket } from "../../helpers";

export const sendCircularTokenUpdate = wrapSocket<{ uuid: string; text: string; temporary: boolean }>(
    "Shape.CircularToken.Value.Set",
);
