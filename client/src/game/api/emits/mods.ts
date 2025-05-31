import type { ApiModLink } from "../../../apiTypes";
import { wrapSocket } from "../helpers";

export const sendLinkModToRoom = wrapSocket<ApiModLink>("Mods.Room.Link");
// export const sendLinkModToClient = wrapSocket<ApiModLink>("Mods.Room.LinkUser");
export const sendRemoveModFromRoom = wrapSocket<ApiModLink>("Mods.Room.Remove");
