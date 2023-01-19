import type {
    ClientConnected,
    ClientDisconnected,
    ClientGameboardSet,
    ClientMove,
    ClientOffsetSet,
    ClientViewport,
} from "../../../apiTypes";
import { clientSystem } from "../../systems/client";
import type { BoardId, ClientId } from "../../systems/client/models";
import { gameState } from "../../systems/game/state";
import { playerSystem } from "../../systems/players";
import type { PlayerId } from "../../systems/players/models";
import { positionSystem } from "../../systems/position";
import { socket } from "../socket";

socket.on("Client.Connected", (data: ClientConnected) => {
    clientSystem.addClient(data.player as PlayerId, data.client as ClientId);
});

socket.on("Client.Disconnected", (data: ClientDisconnected) => {
    clientSystem.removeClient(data.client as ClientId);
});

socket.on("Client.Move", (data: ClientMove) => {
    const { client, position } = data;
    const player = clientSystem.getPlayer(client as ClientId);
    if (player === undefined) return;

    const isCurrentPlayer = playerSystem.getCurrentPlayer()?.id === player;
    if (gameState.isDmOrFake.value && !isCurrentPlayer) {
        playerSystem.setPosition(player, position);
    } else if (isCurrentPlayer) {
        positionSystem.setPan(position.pan_x, position.pan_y, { updateSectors: false });
        positionSystem.setZoomDisplay(position.zoom_display, { invalidate: true, updateSectors: true, sync: false });
    }
});

socket.on("Client.Viewport.Set", (data: ClientViewport) => {
    clientSystem.setClientViewport(data.client as ClientId, data.viewport, true);
});

socket.on("Client.Offset.Set", (data: ClientOffsetSet) => {
    clientSystem.setOffset(data.client as ClientId, { x: data.x, y: data.y }, false);
});

socket.on("Client.Gameboard.Set", (data: ClientGameboardSet) => {
    clientSystem.addBoardId(data.client as ClientId, data.boardId as BoardId);
});
