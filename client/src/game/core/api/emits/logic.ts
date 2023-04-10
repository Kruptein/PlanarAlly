import type { LogicDoorRequest, LogicTeleportRequest } from "../../../../apiTypes";
import type { PlayerId } from "../../systems/players/models";
import { wrapSocket } from "../helpers";

export const sendRequest = wrapSocket<LogicDoorRequest | LogicTeleportRequest>("Logic.Request");
export const sendDeclineRequest = wrapSocket<PlayerId>("Logic.Request.Decline");
