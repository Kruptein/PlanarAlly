import { coreStore } from "../../../core/store";
import { layerManager } from "../../layers/manager";
import { floorStore, getFloorId } from "../../layers/store";
import { addFloor, removeFloor } from "../../layers/utils";
import { ServerFloor } from "../../models/general";
import { socket } from "../socket";

socket.on("Floor.Create", async (data: { floor: ServerFloor; creator: string }) => {
    await addFloor(data.floor);
    if (data.creator === coreStore.username) floorStore.selectFloor({ targetFloor: data.floor.name, sync: true });
});

socket.on("Floor.Remove", (floor: string) => {
    removeFloor(getFloorId(floor));
});

socket.on("Floor.Visible.Set", (data: { name: string; visible: boolean }) => {
    const floor = layerManager.getFloor(getFloorId(data.name));
    if (floor === undefined) return;
    floor.playerVisible = data.visible;
});

socket.on("Floor.Rename", (data: { index: number; name: string }) => {
    floorStore.renameFloor({ ...data, sync: false });
});

socket.on("Floors.Reorder", (floors: string[]) => floorStore.reorderFloors({ floors, sync: false }));
