import { EditableServerClient, LocationServerClient } from "../../comm/types/settings";
import { gameStore } from "../../store";
import { socket } from "../socket";
import { wrapSocket } from "../helpers";

export function sendClientLocationOptions(): void {
    _sendClientLocationOptions({ pan_x: gameStore.panX, pan_y: gameStore.panY, zoom_factor: gameStore.zoomFactor });
}

function _sendClientLocationOptions(locationOptions: LocationServerClient): void {
    socket.emit("Client.Options.Set", { location_options: locationOptions });
}

export const sendClientOptions = wrapSocket<Partial<EditableServerClient>>("Client.Options.Set");
