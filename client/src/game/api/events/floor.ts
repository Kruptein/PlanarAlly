import { coreStore } from "../../../store/core";
import { addServerFloor } from "../../floor/server";
import type { ServerFloor } from "../../models/general";
import { floorSystem } from "../../systems/floors";
import { socket } from "../socket";

socket.on("Floor.Create", (data: { floor: ServerFloor; creator: string }) => {
    addServerFloor(data.floor);
    if (data.creator === coreStore.state.username) floorSystem.selectFloor({ name: data.floor.name }, true);
});

socket.on("Floor.Remove", (name: string) => {
    floorSystem.removeFloor({ name }, false);
});

socket.on("Floor.Visible.Set", (data: { name: string; visible: boolean }) => {
    floorSystem.setFloorPlayerVisible({ name: data.name }, data.visible, false);
});

socket.on("Floor.Rename", (data: { index: number; name: string }) => {
    floorSystem.renameFloor(data.index, data.name, false);
});

socket.on("Floors.Reorder", (floors: string[]) => floorSystem.reorderFloors(floors, false));

socket.on("Floor.Type.Set", (data: { name: string; floorType: number }) => {
    floorSystem.setFloorType({ name: data.name }, data.floorType, false);
});

socket.on("Floor.Background.Set", (data: { name: string; background?: string }) => {
    floorSystem.setFloorBackground({ name: data.name }, data.background, false);
});
