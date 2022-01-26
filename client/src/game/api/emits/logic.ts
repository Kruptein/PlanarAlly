import { wrapSocket } from "../helpers";

export const sendDoorRequest = wrapSocket<string>("Logic.Door.Request");
export const sendDeclineDoorRequest = wrapSocket<string>("Logic.Door.Request.Decline");
