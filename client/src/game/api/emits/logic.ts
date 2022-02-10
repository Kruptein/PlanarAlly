import type { RequestType } from "../../models/logic";
import type { Global } from "../../shapes/localId";
import { wrapSocket } from "../helpers";

export const sendRequest = wrapSocket<Global<RequestType>>("Logic.Request");
export const sendDeclineRequest = wrapSocket<string>("Logic.Request.Decline");
