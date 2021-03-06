import { ServerUserOptions, ServerUserLocationOptions } from "../../models/settings";
import { gameStore } from "../../store";
import { wrapSocket } from "../helpers";
import { socket } from "../socket";

export function sendClientLocationOptions(): void {
    _sendClientLocationOptions({ pan_x: gameStore.panX, pan_y: gameStore.panY, zoom_factor: gameStore.zoomDisplay });
}

function _sendClientLocationOptions(locationOptions: ServerUserLocationOptions): void {
    socket.emit("Client.Options.Location.Set", locationOptions);
}

export const sendRoomClientOptions = wrapSocket<Partial<ServerUserOptions>>("Client.Options.Room.Set");
export const sendDefaultClientOptions = wrapSocket<Partial<ServerUserOptions>>("Client.Options.Default.Set");
