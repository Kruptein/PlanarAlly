import { floorStore } from "../../layers/store";
import { socket } from "../socket";

export function sendCreateFloor(data: string): void {
    socket.emit("Floor.Create", data);
}

export function sendRemoveFloor(floor: string): void {
    socket.emit("Floor.Remove", floor);
}

export function sendFloorSetVisible(data: { name: string; visible: boolean }): void {
    socket.emit("Floor.Visible.Set", data);
}

export function sendRenameFloor(index: number, name: string): void {
    socket.emit("Floor.Rename", { index, name });
    floorStore.renameFloor({ index, name });
}

export function sendFloorReorder(floors: string[]): void {
    socket.emit("Floors.Reorder", floors);
}

export function sendActiveLayer(data: { floor: string; layer: string }): void {
    socket.emit("Client.ActiveLayer.Set", data);
}
