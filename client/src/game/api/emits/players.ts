import { socket } from "../socket";

export function sendBringPlayers(data: { floor: string; x: number; y: number; zoom: number }): void {
    socket.emit("Players.Bring", data);
}
