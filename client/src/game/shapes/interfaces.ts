export interface Tracker {
    uuid: string;
    visible: boolean;
    name: string;
    value: number;
    maxvalue: number;
    temporary: boolean; // this is for trackers unknown to the server
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
    temporary: boolean; // this is for auras unknown to the server
}

export interface Label {
    uuid: string;
    category: string;
    name: string;
    visible: boolean;
    user: string;
}
