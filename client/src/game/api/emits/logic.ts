import type { RequestType } from "../../models/logic";
import { wrapSocket } from "../helpers";

export const sendRequest = wrapSocket<RequestType>("Logic.Request");
export const sendDeclineRequest = wrapSocket<string>("Logic.Request.Decline");
