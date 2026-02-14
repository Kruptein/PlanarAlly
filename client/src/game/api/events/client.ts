import type {
    ClientConnected,
    ClientDisconnected,
    ClientMove,
    ClientOffsetSet,
    ClientViewport,
} from "../../../apiTypes";
import { clientSystem } from "../../systems/client";
import { gameState } from "../../systems/game/state";
import { playerSystem } from "../../systems/players";
import { positionSystem } from "../../systems/position";
import { socket } from "../socket";

socket.on("Client.Connected", (data: ClientConnected) => {
    clientSystem.addClient(data.player, data.client);
});

socket.on("Client.Disconnected", (data: ClientDisconnected) => {
    clientSystem.removeClient(data.client);
});

socket.on("Client.Move", (data: ClientMove) => {
    const { client, position } = data;
    const player = clientSystem.getPlayer(client);
    if (player === undefined) return;

    const isCurrentPlayer = playerSystem.getCurrentPlayer()?.id === player;
    if (gameState.isDmOrFake.value && !isCurrentPlayer) {
        playerSystem.setPosition(player, position);
    } else if (isCurrentPlayer) {
        positionSystem.setPan(position.pan_x, position.pan_y, { updateSectors: false });
        positionSystem.setZoomDisplay(position.zoom_display, {
            invalidate: true,
            updateSectors: true,
            sync: false,
        });
    }
});

socket.on("Client.Viewport.Set", (data: ClientViewport) => {
    clientSystem.setClientViewport(data.client, data.viewport, true);
});

socket.on("Client.Offset.Set", (data: ClientOffsetSet) => {
    clientSystem.setOffset(data.client, { x: data.x, y: data.y }, false);
});
