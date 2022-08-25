import { getLocalStorageObject } from "../../../localStorageHelpers";
import { clientStore } from "../../../store/client";
import { gameStore } from "../../../store/game";
import { Role } from "../../models/role";
import type { ServerUserLocationOptions } from "../../models/settings";
import { startDrawLoop } from "../../rendering/core";
import { clientSystem } from "../../systems/client";
import type { ClientId, Viewport } from "../../systems/client/models";
import { floorSystem } from "../../systems/floors";
import { playerSystem } from "../../systems/players";
import type { Player } from "../../systems/players/models";
import { getClientId, socket } from "../socket";

socket.on(
    "Players.Info.Set",
    (
        data: {
            core: Omit<Player, "showRect">;
            position?: ServerUserLocationOptions;
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

            if (player.core.name === clientStore.state.username) {
                found = true;
                gameStore.setDm(player.core.role === Role.DM);
                if (player.position !== undefined) {
                    clientStore.setZoomDisplay(player.position.zoom_display, { invalidate: true, sync: false });
                    clientStore.setPan(player.position.pan_x, player.position.pan_y, { needsOffset: false });
                    if (player.position.active_layer !== undefined)
                        floorSystem.selectLayer(player.position.active_layer, false);
                    const offset = getLocalStorageObject("PA_OFFST") as { x?: number; y?: number } | undefined;
                    clientSystem.initViewport();
                    if (offset !== undefined) clientSystem.setOffset(getClientId(), offset, false);
                    clientSystem.sendViewportInfo();
                }
            }
        }
        if (!found) {
            socket.disconnect();
            return;
        }

        // then we can start the draw loop
        startDrawLoop();

        // then we add client rects if applicable
        for (const player of data) {
            for (const client of player.clients ?? []) {
                clientSystem.addClient(player.core.id, client.sid);
                if (client.viewport) clientSystem.setClientViewport(client.sid, client.viewport);
            }
        }
    },
);
