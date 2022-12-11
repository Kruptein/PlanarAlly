import type { GlobalId } from "../../id";
import { wrapSocket } from "../helpers";
import { socket } from "../socket";

export const sendLgTokenConnect = wrapSocket<{ typeId: number; uuid: GlobalId }>("Lg.Token.Connect");
export const sendLgShowGridIds = (): void => {
    socket.emit("Lg.Grid.Ids.Show");
};
export const sendLgHideGridIds = (): void => {
    socket.emit("Lg.Grid.Ids.Hide");
};
