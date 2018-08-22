interface Tracker {
    uuid: string;
    visible: boolean;
    name: string;
    value: number;
    maxvalue: number;
}

interface Aura {
    uuid: string;
    lightSource: boolean;
    visible: boolean;
    name: string;
    value: number;
    dim: number;
    colour: string;
    lastPath?: Path2D;
}