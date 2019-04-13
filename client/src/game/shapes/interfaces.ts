interface Tracker {
    uuid: string;
    visible: boolean;
    name: string;
    value: number;
    maxvalue: number;
}

interface Aura {
    uuid: string;
    visionSource: boolean;
    visible: boolean;
    name: string;
    value: number;
    dim: number;
    colour: string;
    lastPath?: Path2D;
}

interface Label {
    uuid: string;
    category: string;
    name: string;
    visible: boolean;
    user: string;
}
