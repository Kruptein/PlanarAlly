import { clientStore } from "../../../store/client";
import { ServerClient, userOptionsToClient } from "../../models/settings";
import { socket } from "../socket";

export let activeLayerToselect: string | undefined;

socket.on("Client.Options.Set", (options: ServerClient) => {
    clientStore.setUsername(options.name);

    clientStore.setDefaultClientOptions(userOptionsToClient(options.default_user_options));

    if (options.room_user_options?.grid_size !== undefined)
        clientStore.setGridSize(options.room_user_options.grid_size, false);
    else clientStore.setGridSize(options.default_user_options.grid_size, false);
    if (options.room_user_options?.grid_colour !== undefined)
        clientStore.setGridColour(options.room_user_options.grid_colour, false);
    else clientStore.setGridColour(options.default_user_options.grid_colour, false);
    if (options.room_user_options?.fow_colour !== undefined)
        clientStore.setFowColour(options.room_user_options.fow_colour, false);
    else clientStore.setFowColour(options.default_user_options.fow_colour, false);
    if (options.room_user_options?.ruler_colour !== undefined)
        clientStore.setRulerColour(options.room_user_options.ruler_colour, false);
    else clientStore.setRulerColour(options.default_user_options.ruler_colour, false);
    if (options.room_user_options?.invert_alt !== undefined)
        clientStore.setInvertAlt(options.room_user_options.invert_alt, false);
    else clientStore.setInvertAlt(options.default_user_options.invert_alt, false);
    if (options.room_user_options?.disable_scroll_to_zoom !== undefined)
        clientStore.setDisableScrollToZoom(options.room_user_options.disable_scroll_to_zoom, false);
    else clientStore.setDisableScrollToZoom(options.default_user_options.disable_scroll_to_zoom, false);

    clientStore.setPanX(options.location_user_options.pan_x);
    clientStore.setPanY(options.location_user_options.pan_y);
    clientStore.setZoomDisplay(options.location_user_options.zoom_factor);

    activeLayerToselect = options.location_user_options.active_layer;
});
