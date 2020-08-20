interface Tracker {
    uuid: string;
    visible: boolean;
    name: string;
    value: number;
    maxvalue: number;
    temporary: boolean; // this is for trackers unknown to the server
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
