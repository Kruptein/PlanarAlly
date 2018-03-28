import { Layer } from "./layers";

export interface LocationOptions {
    useGrid: boolean;
    unitSize: number;
    fullFOW: boolean;
    fowColour: string;
    fowOpacity: number;
}

export interface ClientOptions {
    gridColour: string;
    fowColour: string;
    panX: number;
    panY: number;
    zoomFactor: number;
}

export interface AssetList {
    files: string[];
    folders: {[name: string]: AssetList};
}

export interface ServerShape {
    layer: string;
    uuid: string;
    type: string;
    src: string;
    w: number;
    h: number;
    fill: string;
    movementObstruction: boolean;
}

export interface InitiativeData {
    uuid: string;
    initiative?: number;
    owners: string[];
    visible: boolean;
    group: boolean;
    src: string;
}

interface ServerLayer {
    name: string;
    layer: string;
    shapes: ServerShape[];
    grid: boolean;
    selectable: boolean;
    player_editable: boolean;
    size: number;
}

export interface BoardInfo {
    locations: string[];
    board: {
        layers: ServerLayer[];
    };
}