import type { PlayersInfoSet } from "../../../../apiTypes";
import { Role } from "../../../models/role";
import { clientSystem } from "../../../systems/client";
import { gameSystem } from "../../../systems/game";
import { playerSystem } from "../../../systems/players";
import type { PlayerId } from "../../../systems/players/models";
import { socket } from "../../socket";

socket.on("Players.Info.Set", (data: PlayersInfoSet[]) => {
    // First find current user to set pan/zoom
    let found = false;
    for (const player of data) {
        const id = player.core.id as PlayerId;
        playerSystem.addPlayer({ ...player.core, id, showRect: false });

        if (player.position !== undefined) {
            playerSystem.setPosition(id, player.position);
        }

        if (player.core.name === playerSystem.getCurrentPlayer()?.name) {
            found = true;
            gameSystem.setDm(player.core.role === Role.DM);
        }
    }
    if (!found) {
        socket.disconnect();
        return;
    }

    // then we add client rects if applicable
    for (const player of data) {
        for (const client of player.clients ?? []) {
            const clientId = client.client;
            clientSystem.addClient(player.core.id as PlayerId, clientId);
            if (client.viewport) clientSystem.setClientViewport(clientId, client.viewport, false);
        }
    }
});
