import type {
    ApiOptionalUserOptions,
    ApiUserOptions,
    ClientMove,
    ClientPosition,
    TempClientPosition,
    Viewport,
} from "../../../apiTypes";
import type { ClientId } from "../../systems/client/models";
import { positionState } from "../../systems/position/state";
import { wrapSocket } from "../helpers";
import { socket } from "../socket";

export function sendClientLocationOptions(temp: boolean): void {
    const state = positionState.readonly;
    _sendClientLocationOptions(
        {
            pan_x: state.panX - state.gridOffset.x,
            pan_y: state.panY - state.gridOffset.y,
            zoom_display: positionState.raw.zoomDisplay,
        },
        temp,
    );
}

function _sendClientLocationOptions(locationOptions: ClientPosition, temp: boolean): void {
    const data: TempClientPosition = { position: locationOptions, temp };
    socket.emit("Client.Options.Location.Set", data);
}

export const sendViewport = wrapSocket<Viewport>("Client.Viewport.Set");
export const sendOffset = wrapSocket<{ client: ClientId; x?: number; y?: number }>("Client.Offset.Set");

export function sendRoomClientOptions<T extends keyof ApiUserOptions>(
    key: T,
    value: ApiUserOptions[T] | undefined,
    defaultValue: ApiUserOptions[T] | undefined,
): void {
    const event = defaultValue !== undefined ? "Client.Options.Default.Set" : "Client.Options.Room.Set";
    const val = defaultValue !== undefined ? defaultValue : value ?? null;
    const data: Partial<ApiOptionalUserOptions> = { [key]: val };
    socket.emit(event, data);
}

export const sendMoveClient = wrapSocket<ClientMove>("Client.Move");
