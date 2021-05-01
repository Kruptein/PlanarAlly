import { coreStore } from "../../../store/core";
import { floorStore } from "../../../store/floor";
import { ServerFloor } from "../../models/general";
import { socket } from "../socket";

socket.on("Floor.Create", (data: { floor: ServerFloor; creator: string }) => {
    floorStore.addServerFloor(data.floor);
    if (data.creator === coreStore.state.username) floorStore.selectFloor({ name: data.floor.name }, true);
});

socket.on("Floor.Remove", (name: string) => {
    floorStore.removeFloor({ name }, false);
});

socket.on("Floor.Visible.Set", (data: { name: string; visible: boolean }) => {
    floorStore.setFloorPlayerVisible({ name: data.name }, data.visible, false);
});

socket.on("Floor.Rename", (data: { index: number; name: string }) => {
    floorStore.renameFloor(data.index, data.name, false);
});

socket.on("Floors.Reorder", (floors: string[]) => floorStore.reorderFloors(floors, false));
