import { ServerClient } from "../../comm/types/settings";
import { layerManager } from "../../layers/manager";
import { gameStore } from "../../store";
import { zoomDisplay } from "../../utils";
import { socket } from "../socket";

socket.on("Client.Options.Set", (options: ServerClient) => {
    gameStore.setUsername(options.name);
    gameStore.setDM(options.name === decodeURIComponent(window.location.pathname.split("/")[2]));

    gameStore.setGridSize({ gridSize: options.grid_size, sync: false });
    gameStore.setGridColour({ colour: options.grid_colour, sync: false });
    gameStore.setFOWColour({ colour: options.fow_colour, sync: false });
    gameStore.setRulerColour({ colour: options.ruler_colour, sync: false });
    gameStore.setInvertAlt({ invertAlt: options.invert_alt, sync: false });
    gameStore.setPanX(options.pan_x);
    gameStore.setPanY(options.pan_y);
    gameStore.setZoomDisplay(zoomDisplay(options.zoom_factor));

    socket.once("Board.Floor.Set", () => {
        if (options.active_layer) layerManager.selectLayer(options.active_layer, false);
    });
});
