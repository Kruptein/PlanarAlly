import { wrapSocket } from "../helpers";

export const sendCreateFloor = wrapSocket<string>("Floor.Create");
export const sendRemoveFloor = wrapSocket<string>("Floor.Remove");
export const sendFloorSetVisible = wrapSocket<{ name: string; visible: boolean }>("Floor.Visible.Set");
export const sendActiveLayer = wrapSocket<{ floor: string; layer: string }>("Client.ActiveLayer.Set");
export const sendFloorReorder = wrapSocket<string[]>("Floors.Reorder");
export const sendRenameFloor = wrapSocket<{ index: number; name: string }>("Floor.Rename");
export const sendFloorSetType = wrapSocket<{ name: string; floorType: number }>("Floor.Type.Set");
export const sendFloorSetBackground = wrapSocket<{ name: string; background?: string }>("Floor.Background.Set");
