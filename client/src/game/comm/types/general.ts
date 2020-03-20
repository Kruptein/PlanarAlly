import { ServerShape } from "@/game/comm/types/shapes";
import { VisibilityMode } from "@/game/visibility/store";

export interface ServerLocation {
    name: string;
    use_grid: boolean;
    unit_size: number;
    unit_size_unit: string;
    full_fow: boolean;
    fow_opacity: number;
    fow_los: boolean;
    vision_mode: string;
    vision_min_range: number;
    vision_max_range: number;
}

export interface ServerClient {
    name: string;
    grid_colour: string;
    fow_colour: string;
    ruler_colour: string;
    pan_x: number;
    pan_y: number;
    zoom_factor: number;
    active_layer?: string;
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

export interface ServerFloor {
    name: string;
    layers: ServerLayer[];
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
    floors: ServerFloor[];
}

export interface Note {
    title: string;
    text: string;
    uuid: string;
}
