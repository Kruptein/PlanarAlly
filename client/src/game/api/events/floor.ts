import { coreStore } from "../../../core/store";
import { ServerFloor } from "../../comm/types/general";
import { EventBus } from "../../event-bus";
import { layerManager } from "../../layers/manager";
import { floorStore } from "../../layers/store";
import { addFloor, removeFloor } from "../../layers/utils";
import { socket } from "../socket";

socket.on("Floor.Create", (data: { floor: ServerFloor; creator: string }) => {
    addFloor(data.floor);
    if (data.creator === coreStore.username) floorStore.selectFloor({ targetFloor: data.floor.name, sync: true });
});

socket.on("Floor.Remove", removeFloor);

socket.on("Floor.Visible.Set", (data: { name: string; visible: boolean }) => {
    const floor = layerManager.getFloor(data.name);
    if (floor === undefined) return;
    floor.playerVisible = data.visible;
    EventBus.$emit("Floor.Visible.Set");
});

socket.on("Floor.Rename", (data: { index: number; name: string }) => {
    floorStore.renameFloor(data);
});

socket.on("Floors.Reorder", (floors: string[]) => floorStore.reorderFloors({ floors, sync: false }));

export function sendRenameFloor(index: number, name: string): void {
    socket.emit("Floor.Rename", { index, name });
    floorStore.renameFloor({ index, name });
}

export function sendFloorReorder(floors: string[]): void {
    socket.emit("Floors.Reorder", floors);
}
