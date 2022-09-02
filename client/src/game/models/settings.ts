import { getLocalId } from "../id";
import type { GlobalId, LocalId } from "../id";

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

    air_map_background?: string | null;
    ground_map_background?: string | null;
    underground_map_background?: string | null;
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
    spawnLocations: LocalId[];
    movePlayerOnTokenChange: boolean;

    airMapBackground: string | null;
    groundMapBackground: string | null;
    undergroundMapBackground: string | null;
}

export interface ServerUserLocationOptions {
    pan_x: number;
    pan_y: number;
    zoom_display: number;
    active_floor?: string;
    active_layer?: string;
}

function parseSpawnLocations(spawn_locations: string): LocalId[] {
    const spawnLocations: GlobalId[] = JSON.parse(spawn_locations);
    return spawnLocations.map((s) => getLocalId(s)!);
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
    spawnLocations: parseSpawnLocations(options.spawn_locations),
    movePlayerOnTokenChange: options.move_player_on_token_change,

    airMapBackground: options.air_map_background ?? null,
    groundMapBackground: options.ground_map_background ?? null,
    undergroundMapBackground: options.underground_map_background ?? null,
});
