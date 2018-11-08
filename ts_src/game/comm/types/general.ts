import { ServerShape } from "./shapes";

export interface ServerLocation {
    name: string;
    use_grid: boolean;
    unit_size: number;
    full_fow: boolean;
    fow_opacity: number;
    fow_los: boolean;
}

export interface ServerClient {
    name: string;
    grid_colour: string;
    fow_colour: string;
    ruler_colour: string;
    pan_x: number;
    pan_y: number;
    zoom_factor: number;
}

export interface InitiativeData {
    uuid: string;
    initiative?: number;
    visible: boolean;
    group: boolean;
    source: string;
    has_img: boolean;
    effects: InitiativeEffect[];
    index: number;
}

export interface InitiativeEffect {
    uuid: string;
    name: string;
    turns: number;
}

export interface ServerLayer {
    type_: string;
    name: string;
    layer: string;
    shapes: ServerShape[];
    selectable: boolean;
    player_editable: boolean;
    player_visible: boolean;
    size?: number;
}

export interface BoardInfo {
    locations: string[];
    layers: ServerLayer[];
}

export interface Note {
    title: string;
    text: string;
    uuid: string;
}
