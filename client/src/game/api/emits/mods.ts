import type { ApiModLink, ApiModMeta } from "../../../apiTypes";
import { wrapSocket, wrapSocketWithAck } from "../helpers";

export const sendGetRoomMods = wrapSocketWithAck<ApiModMeta[]>("Mods.Room.Get");

export const sendLinkModToRoom = wrapSocket<ApiModLink>("Mods.Room.Link");
export const sendLinkModToClient = wrapSocket<ApiModLink>("Mods.Room.LinkUser");
export const sendRemoveModFromRoom = wrapSocket<ApiModLink>("Mods.Room.Remove");
