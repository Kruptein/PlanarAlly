import { coreStore } from "../../../core/store";
import { ServerFloor } from "../../comm/types/general";
import { addFloor, removeFloor } from "../../layers/utils";
import { gameStore } from "../../store";
import { socket } from "../socket";

socket.on("Floor.Create", (data: { floor: ServerFloor; creator: string }) => {
    addFloor(data.floor);
    if (data.creator === coreStore.username) gameStore.selectFloor({ targetFloor: data.floor.name, sync: true });
});

socket.on("Floor.Remove", removeFloor);
