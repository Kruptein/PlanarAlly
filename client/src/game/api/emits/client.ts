import { clientStore } from "../../../store/client";
import { ServerUserOptions, ServerUserLocationOptions } from "../../models/settings";
import { wrapSocket } from "../helpers";
import { socket } from "../socket";

export function sendClientLocationOptions(): void {
    const state = clientStore.state;
    _sendClientLocationOptions({ pan_x: state.panX, pan_y: state.panY, zoom_factor: state.zoomDisplay });
}

function _sendClientLocationOptions(locationOptions: ServerUserLocationOptions): void {
    socket.emit("Client.Options.Location.Set", locationOptions);
}

export const sendRoomClientOptions = wrapSocket<Partial<ServerUserOptions>>("Client.Options.Room.Set");
export const sendDefaultClientOptions = wrapSocket<Partial<ServerUserOptions>>("Client.Options.Default.Set");
