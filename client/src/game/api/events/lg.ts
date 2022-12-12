import { lastGameboardStore } from "../../../store/lastGameboard";
import { getLocalId } from "../../id";
import type { GlobalId } from "../../id";
import { socket } from "../socket";

socket.on("Lg.Token.Connect", (data: { typeId: number; uuid: GlobalId }) => {
    lastGameboardStore.addLgShape(data.typeId, getLocalId(data.uuid)!, false);
});

socket.on("Lg.Grid.Ids.Show", () => {
    lastGameboardStore.showGridId(true, false);
});

socket.on("Lg.Grid.Ids.Hide", () => {
    lastGameboardStore.showGridId(false, false);
});
