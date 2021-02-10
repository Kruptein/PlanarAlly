import { gameStore } from "../../store";
import { socket } from "../socket";

socket.on("Player.Role.Set", (data: { player: number; role: number }) => {
    gameStore.setPlayerRole({ ...data, sync: false });
});
