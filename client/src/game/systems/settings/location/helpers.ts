import { getLocalId } from "../../../id";
import type { GlobalId, LocalId } from "../../../id";

import type { LocationOptions, ServerLocationOptions, WithLocationDefault } from "./models";

export function isDefaultWrapper(x: any): x is WithLocationDefault<unknown> {
    return x.default !== undefined && x.location !== undefined;
}

export function locationOptionsToClient(options: ServerLocationOptions): LocationOptions;
export function locationOptionsToClient(options: Partial<ServerLocationOptions>): Partial<LocationOptions>;
export function locationOptionsToClient(options: Partial<ServerLocationOptions>): Partial<LocationOptions> {
    return {
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
        spawnLocations: options.spawn_locations !== undefined ? parseSpawnLocations(options.spawn_locations) : [],
        movePlayerOnTokenChange: options.move_player_on_token_change,

        airMapBackground: options.air_map_background,
        groundMapBackground: options.ground_map_background,
        undergroundMapBackground: options.underground_map_background,
    };
}

function parseSpawnLocations(spawn_locations: string): LocalId[] {
    const spawnLocations: GlobalId[] = JSON.parse(spawn_locations);
    return spawnLocations.map((s) => getLocalId(s)!);
}
