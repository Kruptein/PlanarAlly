import type { PlayerRoleSet } from "../../../../../apiTypes";
import { playerSystem } from "../../../systems/players";
import { socket } from "../../socket";

socket.on("Player.Role.Set", (data: PlayerRoleSet) => {
    playerSystem.setPlayerRole(data.player, data.role, false);
});
