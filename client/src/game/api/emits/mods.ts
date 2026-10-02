import type { ApiModLink } from "../../../apiTypes";
import { socket, wrapSocket } from "../socket";

export const sendLinkModToRoom = wrapSocket<ApiModLink>("Mods.Room.Link");
// export const sendLinkModToClient = wrapSocket<ApiModLink>("Mods.Room.LinkUser");
export const sendRemoveModFromRoom = wrapSocket<ApiModLink>("Mods.Room.Remove");

export function sendReloadDevMods(): void {
    socket.emit("Mods.Dev.Reload");
}
