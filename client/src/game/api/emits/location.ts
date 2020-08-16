import { ServerLocationOptions } from "../../comm/types/settings";
import { socket } from "../socket";
import { ServerAsset } from "../../comm/types/shapes";

export function sendLocationOptions(data: { options: Partial<ServerLocationOptions>; location: number | null }): void {
    socket.emit("Location.Options.Set", data);
}

export function sendLocationOrder(data: number[]): void {
    socket.emit("Locations.Order.Set", data);
}

export function sendLocationChange(data: { location: number; users: string[] }): void {
    socket.emit("Location.Change", data);
}

export function sendNewLocation(data: string): void {
    socket.emit("Location.New", data);
}

export async function requestSpawnInfo(location: number): Promise<ServerAsset[]> {
    socket.emit("Location.Spawn.Info.Get", location);
    return await new Promise((resolve: (value: ServerAsset[]) => void) => socket.once("Location.Spawn.Info", resolve));
}

export function sendLocationRename(data: { location: number; name: string }): void {
    socket.emit("Location.Rename", data);
}

export function sendLocationRemove(data: number): void {
    socket.emit("Location.Delete", data);
}
