import { socket, wrapSocket } from "../socket";

export const sendRoomLock = wrapSocket<boolean>("Room.Info.Set.Locked");
export const sendRoomKickPlayer = wrapSocket<number>("Room.Info.Players.Kick");
export const sendRefreshInviteCode = (): void => {
    socket.emit("Room.Info.InviteCode.Refresh");
};

export const sendDeleteRoom = (): void => {
    socket.emit("Room.Delete");
};
