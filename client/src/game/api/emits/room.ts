import { socket } from "../socket";

export function sendRoomLock(isLocked: boolean): void {
    socket.emit("Room.Info.Set.Locked", isLocked);
}

export function sendRoomKickPlayer(player: number): void {
    socket.emit("Room.Info.Players.Kick", player);
}
