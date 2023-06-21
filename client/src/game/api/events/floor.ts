import type { FloorBackgroundSet, FloorCreate, FloorRename, FloorTypeSet, FloorVisibleSet } from "../../../apiTypes";
import { coreStore } from "../../../store/core";
import { addServerFloor } from "../../floor/server";
import { floorSystem } from "../../systems/floors";
import { socket } from "../socket";

socket.on("Floor.Create", (data: FloorCreate) => {
    addServerFloor(data.floor);
    if (data.creator === coreStore.state.username) floorSystem.selectFloor({ name: data.floor.name }, true);
});

socket.on("Floor.Remove", (name: string) => {
    floorSystem.removeFloor({ name }, false);
});

socket.on("Floor.Visible.Set", (data: FloorVisibleSet) => {
    floorSystem.setFloorPlayerVisible({ name: data.name }, data.visible, false);
});

socket.on("Floor.Rename", (data: FloorRename) => {
    floorSystem.renameFloor(data.index, data.name, false);
});

socket.on("Floors.Reorder", (floors: string[]) => floorSystem.reorderFloors(floors, false));

socket.on("Floor.Type.Set", (data: FloorTypeSet) => {
    floorSystem.setFloorType({ name: data.name }, data.floorType, false);
});

socket.on("Floor.Background.Set", (data: FloorBackgroundSet) => {
    floorSystem.setFloorBackground({ name: data.name }, data.background, false);
});
