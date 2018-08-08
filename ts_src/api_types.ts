export interface LocationOptions {
    name: string;
    useGrid: boolean;
    unitSize: number;
    fullFOW: boolean;
    fowColour: string;
    fowOpacity: number;
    fowLOS: boolean;
}

export interface ClientOptions {
    gridColour: string;
    fowColour: string;
    locationOptions: {
        [name: string]: {
            panX: number;
            panY: number;
            zoomFactor: number;
        }
    }
}

export interface Notes {
    uuid: string;
    name: string;
    text: string;
}

export interface AssetList {
    [inode: string]: AssetList | AssetFileList[];
}

export interface AssetFileList {
    name: string,
    hash: string
}

export interface InitiativeData {
    uuid: string;
    initiative?: number;
    owners: string[];
    visible: boolean;
    group: boolean;
    src: string;
    has_img: boolean;
    effects: InitiativeEffect[];
}

export interface InitiativeEffect {
    uuid: string;
    name: string;
    turns: number;
}

export interface ServerLayer {
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

export interface ServerShape {
    uuid: string;
    type: string;
    x: number;
    y: number;
    layer: string;
    movementObstruction: boolean;
    visionObstruction: boolean;
    globalCompositeOperation: string;
    trackers: Tracker[];
    auras: Aura[];
    owners: string[];
    fill?: string;
    name?: string;
    annotation?: string;
    isToken: boolean;
}

export interface ServerRect extends ServerShape {
    w: number;
    h: number;
    border?: string;
}

export interface ServerCircle extends ServerShape {
    r: number;
    border?: string;
}

export interface ServerCircularToken extends ServerCircle {
    text: string;
    font: string;
}

export interface ServerLine extends ServerShape {
    x2: number;
    y2: number;
}
export interface ServerText extends ServerShape {
    text: string;
    font: string;
    angle?: number;
}
export interface ServerAsset extends ServerRect {
    src: string;
}