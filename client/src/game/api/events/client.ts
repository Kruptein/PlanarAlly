import { colourHistory } from "../../../core/components/store";
import { getGameState } from "../../../store/_game";
import { clientStore } from "../../../store/client";
import { userOptionsToClient } from "../../models/settings";
import type { ServerClient, ServerUserLocationOptions } from "../../models/settings";
import { clientSystem } from "../../systems/client";
import type { ClientId, Viewport } from "../../systems/client/models";
import { playerSystem } from "../../systems/players";
import type { PlayerId } from "../../systems/players/models";
import { socket } from "../socket";

socket.on("Client.Connected", (data: { player: PlayerId; client: ClientId }) => {
    clientSystem.addClient(data.player, data.client);
});

socket.on("Client.Disconnected", (data: ClientId) => {
    clientSystem.removeClient(data);
});

socket.on("Client.Move", (data: { player: PlayerId; client: ClientId } & ServerUserLocationOptions) => {
    const { player, ...locationData } = data;
    const isCurrentPlayer = playerSystem.getCurrentPlayer().id === data.player;
    if (getGameState().isDm && !isCurrentPlayer) {
        playerSystem.setPosition(player, locationData);
    } else if (isCurrentPlayer) {
        clientStore.setPan(data.pan_x, data.pan_y, { needsOffset: false });
        clientStore.setZoomDisplay(data.zoom_display, { invalidate: true, sync: false });
    }
});

socket.on("Client.Viewport.Set", (data: { client: ClientId; viewport: Viewport }) => {
    clientSystem.setClientViewport(data.client, data.viewport);
});

socket.on("Client.Offset.Set", (data: { client: ClientId } & { x?: number; y?: number }) => {
    clientSystem.setOffset(data.client, { x: data.x, y: data.y }, false);
});

socket.on("Client.Options.Set", (options: ServerClient) => {
    clientStore.setUsername(options.name);
    colourHistory.value = options.colour_history === null ? [] : JSON.parse(options.colour_history);

    clientStore.setDefaultClientOptions(userOptionsToClient(options.default_user_options));

    // Appearance
    if (options.room_user_options?.grid_colour !== undefined)
        clientStore.setGridColour(options.room_user_options.grid_colour, false);
    else clientStore.setGridColour(options.default_user_options.grid_colour, false);
    if (options.room_user_options?.fow_colour !== undefined)
        clientStore.setFowColour(options.room_user_options.fow_colour, false);
    else clientStore.setFowColour(options.default_user_options.fow_colour, false);
    if (options.room_user_options?.ruler_colour !== undefined)
        clientStore.setRulerColour(options.room_user_options.ruler_colour, false);
    else clientStore.setRulerColour(options.default_user_options.ruler_colour, false);

    // Behaviour
    if (options.room_user_options?.invert_alt !== undefined)
        clientStore.setInvertAlt(options.room_user_options.invert_alt, false);
    else clientStore.setInvertAlt(options.default_user_options.invert_alt, false);
    if (options.room_user_options?.disable_scroll_to_zoom !== undefined)
        clientStore.setDisableScrollToZoom(options.room_user_options.disable_scroll_to_zoom, false);
    else clientStore.setDisableScrollToZoom(options.default_user_options.disable_scroll_to_zoom, false);

    // Display
    if (options.room_user_options?.use_high_dpi !== undefined)
        clientStore.setUseHighDpi(options.room_user_options.use_high_dpi, false);
    else clientStore.setUseHighDpi(options.default_user_options.use_high_dpi, false);
    if (options.room_user_options?.grid_size !== undefined)
        clientStore.setGridSize(options.room_user_options.grid_size, false);
    else clientStore.setGridSize(options.default_user_options.grid_size, false);
    if (options.room_user_options?.use_as_physical_board !== undefined)
        clientStore.setUseAsPhysicalBoard(options.room_user_options.use_as_physical_board, false);
    else clientStore.setUseAsPhysicalBoard(options.default_user_options.use_as_physical_board, false);
    if (options.room_user_options?.mini_size !== undefined)
        clientStore.setMiniSize(options.room_user_options.mini_size, false);
    else clientStore.setMiniSize(options.default_user_options.mini_size, false);
    if (options.room_user_options?.ppi !== undefined) clientStore.setPpi(options.room_user_options.ppi, false);
    else clientStore.setPpi(options.default_user_options.ppi, false);

    // Initiative
    if (options.room_user_options?.initiative_camera_lock !== undefined)
        clientStore.setInitiativeCameraLock(options.room_user_options.initiative_camera_lock, false);
    else clientStore.setInitiativeCameraLock(options.default_user_options.initiative_camera_lock, false);
    if (options.room_user_options?.initiative_vision_lock !== undefined)
        clientStore.setInitiativeVisionLock(options.room_user_options.initiative_vision_lock, false);
    else clientStore.setInitiativeVisionLock(options.default_user_options.initiative_vision_lock, false);
    if (options.room_user_options?.initiative_effect_visibility !== undefined)
        clientStore.setInitiativeEffectVisibility(options.room_user_options.initiative_effect_visibility, false);
    else clientStore.setInitiativeEffectVisibility(options.default_user_options.initiative_effect_visibility, false);
});
