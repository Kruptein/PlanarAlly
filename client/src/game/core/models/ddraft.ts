interface DDraftCoord {
    x: number;
    y: number;
}

interface DDraftPortal {
    position: DDraftCoord;
    bounds: DDraftCoord[];
    rotation: number;
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
    ddraft_format: string;
    ddraft_resolution: DDraftResolution;
    ddraft_lights: DDraftLight[];
    ddraft_line_of_sight: DDraftCoord[][];
    ddraft_portals: DDraftPortal[];
}
