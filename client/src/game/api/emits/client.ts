import { clientStore } from "../../../store/client";
import type { ServerUserOptions, ServerUserLocationOptions } from "../../models/settings";
import type { ClientId, Viewport } from "../../systems/client/models";
import { wrapSocket } from "../helpers";
import { socket } from "../socket";

export function sendClientLocationOptions(temp: boolean): void {
    const state = clientStore.state;
    _sendClientLocationOptions(
        {
            pan_x: state.panX,
            pan_y: state.panY,
            zoom_display: state.zoomDisplay,
        },
        temp,
    );
}

function _sendClientLocationOptions(locationOptions: ServerUserLocationOptions, temp: boolean): void {
    socket.emit("Client.Options.Location.Set", { options: locationOptions, temp });
}

export function sendViewportInfo(): void {
    const viewport: Viewport = {
        height: window.innerHeight,
        width: window.innerWidth,
    };
    socket.emit("Client.Viewport.Set", viewport);
}

export const sendRoomClientOptions = wrapSocket<Partial<ServerUserOptions>>("Client.Options.Room.Set");
export const sendDefaultClientOptions = wrapSocket<Partial<ServerUserOptions>>("Client.Options.Default.Set");

export const sendMoveClient = wrapSocket<{ client: ClientId; data: ServerUserLocationOptions }>("Client.Move");
