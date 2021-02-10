import { EventBus } from "../../event-bus";
import { layerManager } from "../../layers/manager";
import { ServerClient, userOptionsToClient } from "../../models/settings";
import { gameStore } from "../../store";
import { socket } from "../socket";

socket.on("Client.Options.Set", (options: ServerClient) => {
    gameStore.setUsername(options.name);

    gameStore.setDefaultClientOptions(userOptionsToClient(options.default_user_options));

    if (options.room_user_options?.grid_size)
        gameStore.setGridSize({ gridSize: options.room_user_options.grid_size, sync: false });
    else gameStore.setGridSize({ gridSize: options.default_user_options.grid_size, sync: false });
    if (options.room_user_options?.grid_colour)
        gameStore.setGridColour({ colour: options.room_user_options.grid_colour, sync: false });
    else gameStore.setGridColour({ colour: options.default_user_options.grid_colour, sync: false });
    if (options.room_user_options?.fow_colour)
        gameStore.setFOWColour({ colour: options.room_user_options.fow_colour, sync: false });
    else gameStore.setFOWColour({ colour: options.default_user_options.fow_colour, sync: false });
    if (options.room_user_options?.ruler_colour)
        gameStore.setRulerColour({ colour: options.room_user_options.ruler_colour, sync: false });
    else gameStore.setRulerColour({ colour: options.default_user_options.ruler_colour, sync: false });
    if (options.room_user_options?.invert_alt)
        gameStore.setInvertAlt({ invertAlt: options.room_user_options.invert_alt, sync: false });
    else gameStore.setInvertAlt({ invertAlt: options.default_user_options.invert_alt, sync: false });
    if (options.room_user_options?.disable_scroll_to_zoom)
        gameStore.setDisableScrollToZoom({
            disableScrollToZoom: options.room_user_options.disable_scroll_to_zoom,
            sync: false,
        });
    else
        gameStore.setDisableScrollToZoom({
            disableScrollToZoom: options.default_user_options.disable_scroll_to_zoom,
            sync: false,
        });

    gameStore.setPanX(options.location_user_options.pan_x);
    gameStore.setPanY(options.location_user_options.pan_y);
    gameStore.setZoomDisplay(options.location_user_options.zoom_factor);

    EventBus.$once("Board.Floor.Set", () => {
        if (options.location_user_options.active_layer)
            layerManager.selectLayer(options.location_user_options.active_layer, false);
    });
});
