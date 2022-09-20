import { getGameState } from "../../../store/_game";
import type { ServerUserLocationOptions } from "../../models/settings";
import { clientSystem } from "../../systems/client";
import type { BoardId, ClientId, Viewport } from "../../systems/client/models";
import { playerSystem } from "../../systems/players";
import type { PlayerId } from "../../systems/players/models";
import { positionSystem } from "../../systems/position";
import { socket } from "../socket";

socket.on("Client.Connected", (data: { player: PlayerId; client: ClientId }) => {
    clientSystem.addClient(data.player, data.client);
});

socket.on("Client.Disconnected", (data: ClientId) => {
    clientSystem.removeClient(data);
});

socket.on("Client.Move", (data: { player: PlayerId; client: ClientId } & ServerUserLocationOptions) => {
    const { player, client, ...locationData } = data;
    const isCurrentPlayer = playerSystem.getCurrentPlayer()?.id === data.player;
    if (getGameState().isDm && !isCurrentPlayer) {
        playerSystem.setPosition(player, locationData);
    } else if (isCurrentPlayer) {
        positionSystem.setPan(data.pan_x, data.pan_y, { updateSectors: false });
        positionSystem.setZoomDisplay(data.zoom_display, { invalidate: true, updateSectors: true, sync: false });
    }
});

socket.on("Client.Viewport.Set", (data: { client: ClientId; viewport: Viewport }) => {
    clientSystem.setClientViewport(data.client, data.viewport, true);
});

socket.on("Client.Offset.Set", (data: { client: ClientId } & { x?: number; y?: number }) => {
    clientSystem.setOffset(data.client, { x: data.x, y: data.y }, false);
});

socket.on("Client.Gameboard.Set", (data: { client: ClientId; boardId: BoardId }) => {
    clientSystem.addBoardId(data.client, data.boardId);
});
