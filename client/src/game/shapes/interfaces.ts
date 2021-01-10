export interface Tracker {
    uuid: string;
    visible: boolean;
    name: string;
    value: number;
    maxvalue: number;
}

export interface Aura {
    uuid: string;
    visionSource: boolean;
    visible: boolean;
    name: string;
    value: number;
    dim: number;
    colour: string;
    lastPath?: Path2D;
}

export interface Label {
    uuid: string;
    category: string;
    name: string;
    visible: boolean;
    user: string;
}
