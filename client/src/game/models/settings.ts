import type { LayerName } from "./floor";

export interface Location {
    id: number;
    name: string;
    archived: boolean;
}

export interface ServerUserLocationOptions {
    pan_x: number;
    pan_y: number;
    zoom_display: number;
    active_floor?: string;
    active_layer?: LayerName;
}
