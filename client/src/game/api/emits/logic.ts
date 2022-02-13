import type { Global } from "../../id";
import type { RequestType } from "../../systems/logic/models";
import { wrapSocket } from "../helpers";

export const sendRequest = wrapSocket<Global<RequestType>>("Logic.Request");
export const sendDeclineRequest = wrapSocket<string>("Logic.Request.Decline");
