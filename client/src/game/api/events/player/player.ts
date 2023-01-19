import type { PlayerRoleSet } from "../../../../apiTypes";
import { playerSystem } from "../../../systems/players";
import type { PlayerId } from "../../../systems/players/models";
import { socket } from "../../socket";

socket.on("Player.Role.Set", (data: PlayerRoleSet) => {
    playerSystem.setPlayerRole(data.player as PlayerId, data.role, false);
});
