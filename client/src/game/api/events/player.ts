import { playerSystem } from "../../systems/players";
import { socket } from "../socket";

socket.on("Player.Role.Set", (data: { player: number; role: number }) => {
    playerSystem.setPlayerRole(data.player, data.role, false);
});
