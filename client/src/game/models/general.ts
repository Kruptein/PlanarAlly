import type { ApiGroup, ApiShape } from "../../apiTypes";
import type { ServerLocationOptions } from "../systems/settings/location/models";

export interface ServerLocation {
    id: number;
    name: string;
    options: Partial<ServerLocationOptions>;
}

export interface ServerFloor {
    index: number;
    name: string;
    layers: ServerLayer[];
    player_visible: boolean;
    type_: number;
    background_color: string | null;
}

export interface ServerLayer {
    type_: string;
    index: number;
    name: string;
    groups: ApiGroup[];
    shapes: ApiShape[];
    selectable: boolean;
    player_editable: boolean;
    player_visible: boolean;
    size?: number;
}
