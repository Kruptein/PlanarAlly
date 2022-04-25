import type { ServerGroup } from "./groups";
import type { ServerLocationOptions } from "./settings";
import type { ServerShape } from "./shapes";

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
    groups: ServerGroup[];
    shapes: ServerShape[];
    selectable: boolean;
    player_editable: boolean;
    player_visible: boolean;
    size?: number;
}

export interface Note {
    title: string;
    text: string;
    uuid: string;
}
