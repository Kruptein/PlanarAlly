import type { LogicDoorRequest, LogicTeleportRequest } from "../../../apiTypes";
import { wrapSocket } from "../helpers";

export const sendRequest = wrapSocket<LogicDoorRequest | LogicTeleportRequest>("Logic.Request");
export const sendDeclineRequest = wrapSocket<string>("Logic.Request.Decline");
