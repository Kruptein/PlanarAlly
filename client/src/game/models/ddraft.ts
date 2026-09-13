interface DDraftCoord {
    x: number;
    y: number;
}

interface DDraftPortal {
    position: DDraftCoord;
    bounds: DDraftCoord[];
    rotation: number; // in radians
    closed: boolean;
    freestanding: boolean;
}

interface DDraftResolution {
    map_origin: DDraftCoord;
    map_size: DDraftCoord;
    pixels_per_grid: number;
}

interface DDraftLight {
    position: DDraftCoord;
    range: number;
    intensity: number;
    color: string;
    shadows: boolean;
}

export interface DDraftData {
    format: number;
    resolution: DDraftResolution;
    line_of_sight: DDraftCoord[][];
    objects_line_of_sight?: DDraftCoord[][];
    portals: DDraftPortal[];
    environment: {
        // these are not supported atm
        baked_lighting: boolean;
        ambient_light: string;
    };
    lights: DDraftLight[];
}
