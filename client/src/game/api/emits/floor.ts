import type {
    ClientActiveLayerSet,
    FloorBackgroundSet,
    FloorRename,
    FloorTypeSet,
    FloorVisibleSet,
} from "../../../apiTypes";
import { wrapSocket } from "../socket";

export const sendCreateFloor = wrapSocket<string>("Floor.Create");
export const sendRemoveFloor = wrapSocket<string>("Floor.Remove");
export const sendFloorSetVisible = wrapSocket<FloorVisibleSet>("Floor.Visible.Set");
export const sendActiveLayer = wrapSocket<ClientActiveLayerSet>("Client.ActiveLayer.Set");
export const sendFloorReorder = wrapSocket<string[]>("Floors.Reorder");
export const sendRenameFloor = wrapSocket<FloorRename>("Floor.Rename");
export const sendFloorSetType = wrapSocket<FloorTypeSet>("Floor.Type.Set");
export const sendFloorSetBackground = wrapSocket<FloorBackgroundSet>("Floor.Background.Set");
