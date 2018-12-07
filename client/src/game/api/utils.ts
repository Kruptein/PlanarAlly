import { socket } from "@/game/api/socket";
import { gameStore } from "@/game/store";

export function sendClientOptions() {
    socket.emit("Client.Options.Set", {
        locationOptions: {
            panX: gameStore.panX,
            panY: gameStore.panY,
            zoomFactor: gameStore.zoomFactor,
        },
    });
}
