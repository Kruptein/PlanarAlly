import { gameStore } from "../../../store/game";
import { socket } from "../socket";

socket.on("Player.Role.Set", (data: { player: number; role: number }) => {
    gameStore.setPlayerRole(data.player, data.role, false);
});
