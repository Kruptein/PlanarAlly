export interface ServerLocationOptions {
    use_grid: boolean;
    unit_size: number;
    unit_size_unit: string;
    full_fow: boolean;
    fow_opacity: number;
    fow_los: boolean;
    vision_mode: string;
    vision_min_range: number;
    vision_max_range: number;
    grid_size: number;
    spawn_locations: string;
}

export interface LocationOptions {
    useGrid: boolean;
    unitSize: number;
    unitSizeUnit: string;
    fullFow: boolean;
    fowOpacity: number;
    fowLos: boolean;
    visionMode: string;
    visionMinRange: number;
    visionMaxRange: number;
    gridSize: number;
    spawnLocations: string[];
}

export interface ServerClient {
    name: string;
    grid_colour: string;
    fow_colour: string;
    ruler_colour: string;
    invert_alt: boolean;
    pan_x: number;
    pan_y: number;
    zoom_factor: number;
    active_floor?: string;
    active_layer?: string;
}

export const optionsToServer = (options: LocationOptions): ServerLocationOptions => ({
    // eslint-disable-next-line @typescript-eslint/camelcase
    use_grid: options.useGrid,
    // eslint-disable-next-line @typescript-eslint/camelcase
    unit_size: options.unitSize,
    // eslint-disable-next-line @typescript-eslint/camelcase
    unit_size_unit: options.unitSizeUnit,
    // eslint-disable-next-line @typescript-eslint/camelcase
    full_fow: options.fullFow,
    // eslint-disable-next-line @typescript-eslint/camelcase
    vision_mode: options.visionMode,
    // eslint-disable-next-line @typescript-eslint/camelcase
    fow_opacity: options.fowOpacity,
    // eslint-disable-next-line @typescript-eslint/camelcase
    fow_los: options.fowLos,
    // eslint-disable-next-line @typescript-eslint/camelcase
    vision_min_range: options.visionMinRange,
    // eslint-disable-next-line @typescript-eslint/camelcase
    vision_max_range: options.visionMaxRange,
    // eslint-disable-next-line @typescript-eslint/camelcase
    grid_size: options.gridSize,
    // eslint-disable-next-line @typescript-eslint/camelcase
    spawn_locations: JSON.stringify(options.spawnLocations),
});

export const optionsToClient = (options: ServerLocationOptions): LocationOptions => ({
    useGrid: options.use_grid,
    unitSize: options.unit_size,
    unitSizeUnit: options.unit_size_unit,
    fullFow: options.full_fow,
    visionMode: options.vision_mode,
    fowOpacity: options.fow_opacity,
    fowLos: options.fow_los,
    visionMinRange: options.vision_min_range,
    visionMaxRange: options.vision_max_range,
    gridSize: options.grid_size,
    spawnLocations: JSON.parse(options.spawn_locations),
});
