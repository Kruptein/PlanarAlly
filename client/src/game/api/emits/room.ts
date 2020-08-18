import { socket } from "../socket";
import { wrapSocket } from "../helpers";

export const sendRoomLock = wrapSocket<boolean>("Room.Info.Set.Locked");
export const sendRoomKickPlayer = wrapSocket<number>("Room.Info.Players.Kick");
