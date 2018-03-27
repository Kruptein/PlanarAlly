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
}

export interface InitiativeData {
    uuid: string;
    initiative?: number;
    owners: string[];
    visible: boolean;
    group: boolean;
    src: string;
}

export interface BoardInfo {
    layers: Layer[];
}