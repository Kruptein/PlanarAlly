export interface ServerLocationOptions {
    use_grid: boolean;
    grid_type: string;
    unit_size: number;
    unit_size_unit: string;
    full_fow: boolean;
    fow_opacity: number;
    fow_los: boolean;
    vision_mode: string;
    vision_min_range: number;
    vision_max_range: number;
    spawn_locations: string;
    move_player_on_token_change: boolean;
}

export interface Location {
    id: number;
    name: string;
    archived: boolean;
}

export interface LocationOptions {
    useGrid: boolean;
    gridType: string;
    unitSize: number;
    unitSizeUnit: string;
    fullFow: boolean;
    fowOpacity: number;
    fowLos: boolean;
    visionMode: string;
    visionMinRange: number;
    visionMaxRange: number;
    spawnLocations: string[];
    movePlayerOnTokenChange: boolean;
}

export interface ServerClient extends EditableServerClient, LocationServerClient {
    name: string;
    active_floor?: string;
    active_layer?: string;
}

export interface LocationServerClient {
    pan_x: number;
    pan_y: number;
    zoom_factor: number;
}

export interface EditableServerClient {
    grid_colour: string;
    fow_colour: string;
    ruler_colour: string;
    invert_alt: boolean;
    grid_size: number;
}

export const optionsToClient = (options: ServerLocationOptions): LocationOptions => ({
    useGrid: options.use_grid,
    gridType: options.grid_type ?? "SQUARE",
    unitSize: options.unit_size,
    unitSizeUnit: options.unit_size_unit,
    fullFow: options.full_fow,
    visionMode: options.vision_mode,
    fowOpacity: options.fow_opacity,
    fowLos: options.fow_los,
    visionMinRange: options.vision_min_range,
    visionMaxRange: options.vision_max_range,
    spawnLocations: JSON.parse(options.spawn_locations),
    movePlayerOnTokenChange: options.move_player_on_token_change,
});
