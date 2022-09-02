import { playerSystem } from "../../../systems/players";
import type { PlayerId } from "../../../systems/players/models";
import { socket } from "../../socket";

socket.on("Player.Role.Set", (data: { player: PlayerId; role: number }) => {
    playerSystem.setPlayerRole(data.player, data.role, false);
});
