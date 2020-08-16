import { EditableServerClient, LocationServerClient } from "../../comm/types/settings";
import { gameStore } from "../../store";
import { socket } from "../socket";

export function sendClientLocationOptions(): void {
    // eslint-disable-next-line @typescript-eslint/camelcase
    _sendClientLocationOptions({ pan_x: gameStore.panX, pan_y: gameStore.panY, zoom_factor: gameStore.zoomFactor });
}

function _sendClientLocationOptions(locationOptions: LocationServerClient): void {
    // eslint-disable-next-line @typescript-eslint/camelcase
    socket.emit("Client.Options.Set", { location_options: locationOptions });
}

export function sendClientOptions(data: Partial<EditableServerClient>): void {
    socket.emit("Client.Options.Set", data);
}
