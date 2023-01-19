import type { ClientPosition, Viewport } from "../../../../apiTypes";
import { Role } from "../../../models/role";
import { clientSystem } from "../../../systems/client";
import type { ClientId } from "../../../systems/client/models";
import { gameSystem } from "../../../systems/game";
import { playerSystem } from "../../../systems/players";
import type { Player } from "../../../systems/players/models";
import { socket } from "../../socket";

socket.on(
    "Players.Info.Set",
    (
        data: {
            core: Omit<Player, "showRect">;
            position?: ClientPosition;
            clients?: { sid: ClientId; viewport?: Viewport }[];
        }[],
    ) => {
        // First find current user to set pan/zoom
        let found = false;
        for (const player of data) {
            playerSystem.addPlayer({ ...player.core, showRect: false });

            if (player.position !== undefined) {
                playerSystem.setPosition(player.core.id, player.position);
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
                clientSystem.addClient(player.core.id, client.sid);
                if (client.viewport) clientSystem.setClientViewport(client.sid, client.viewport, false);
            }
        }
    },
);
