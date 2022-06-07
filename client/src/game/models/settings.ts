import { getLocalId } from "../id";
import type { GlobalId, LocalId } from "../id";

import type { InitiativeEffectMode } from "./initiative";

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

export interface ServerClient {
    name: string;
    colour_history: string | null;
    location_user_options: ServerUserLocationOptions;
    default_user_options: ServerUserOptions;
    room_user_options?: ServerUserOptions;
}

export interface ServerUserLocationOptions {
    pan_x: number;
    pan_y: number;
    client_w: number;
    client_h: number;
    zoom_display: number;
    zoom_factor: number;
    active_floor?: string;
    active_layer?: string;
}

export interface ServerUserOptions {
    grid_colour: string;
    fow_colour: string;
    ruler_colour: string;

    invert_alt: boolean;
    disable_scroll_to_zoom: boolean;

    use_high_dpi: boolean;
    grid_size: number;
    use_as_physical_board: boolean;
    mini_size: number;
    ppi: number;

    initiative_camera_lock: boolean;
    initiative_vision_lock: boolean;
    initiative_effect_visibility: InitiativeEffectMode;
}

export interface UserOptions {
    // Appearance
    gridColour: string;
    fowColour: string;
    rulerColour: string;

    // Behaviour
    invertAlt: boolean;
    disableScrollToZoom: boolean;

    // Display
    useHighDpi: boolean;
    useAsPhysicalBoard: boolean;
    gridSize: number;
    miniSize: number;
    ppi: number;

    // Initiative
    initiativeCameraLock: boolean;
    initiativeVisionLock: boolean;
    initiativeEffectVisibility: InitiativeEffectMode;
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

export const userOptionsToClient = (options: ServerUserOptions): UserOptions => ({
    fowColour: options.fow_colour,
    gridColour: options.grid_colour,
    rulerColour: options.ruler_colour,

    invertAlt: options.invert_alt,
    disableScrollToZoom: options.disable_scroll_to_zoom,

    useHighDpi: options.use_high_dpi,
    gridSize: options.grid_size,
    useAsPhysicalBoard: options.use_as_physical_board,
    miniSize: options.mini_size,
    ppi: options.ppi,

    initiativeCameraLock: options.initiative_camera_lock,
    initiativeVisionLock: options.initiative_vision_lock,
    initiativeEffectVisibility: options.initiative_effect_visibility,
});
