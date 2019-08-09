import { socket } from "@/game/api/socket";

export function sendClientOptions(locationOptions: { panX: number; panY: number; zoomFactor: number }): void {
    socket.emit("Client.Options.Set", { locationOptions });
}
