import type { GlobalId } from "../../id";
import { wrapSocket } from "../helpers";

export const sendLgTokenConnect = wrapSocket<{ typeId: number; uuid: GlobalId }>("Lg.Token.Connect");
