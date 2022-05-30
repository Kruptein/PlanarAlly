// Bootup Sequence

import { clientStore } from "../../../store/client";
import { coreStore } from "../../../store/core";
import { gameStore } from "../../../store/game";
import { locationStore } from "../../../store/location";
import { settingsStore } from "../../../store/settings";
import { reserveLocalId } from "../../id";
import type { GlobalId } from "../../id";
import type { ServerLocation } from "../../models/general";
import type { Location, ServerLocationOptions } from "../../models/settings";
import { VisibilityMode, visionState } from "../../vision/state";
import { socket } from "../socket";

socket.on("Location.Set", (data: ServerLocation) => {
    settingsStore.setActiveLocation(data.id);
    gameStore.updatePlayersLocation([clientStore.state.username], data.id, false);
    setLocationOptions(data.id, data.options);
});

socket.on("Locations.Settings.Set", (data: { [key: number]: Partial<ServerLocationOptions> }) => {
    for (const key in data) setLocationOptions(Number.parseInt(key), data[key]);
});

// Varia

socket.on("Location.Options.Set", (data: { options: Partial<ServerLocationOptions>; location: number | null }) => {
    setLocationOptions(data.location ?? undefined, data.options);
});

socket.on("Locations.Order.Set", (locations: Location[]) => {
    locationStore.setLocations(locations, false);
});

socket.on("Location.Change.Start", () => {
    coreStore.setLoading(true);
    gameStore.setBoardInitialized(false);
});

socket.on("Location.Rename", (data: { location: number; name: string }) => {
    locationStore.renameLocation(data.location, data.name, false);
});

export function setLocationOptions(id: number | undefined, options: Partial<ServerLocationOptions>): void {
    if (options?.unit_size !== undefined) settingsStore.setUnitSize(options.unit_size, id, false);
    if (options?.unit_size_unit !== undefined) settingsStore.setUnitSizeUnit(options.unit_size_unit, id, false);
    if (options.use_grid !== undefined) settingsStore.setUseGrid(options.use_grid, id, false);
    if (options.grid_type !== undefined) settingsStore.setGridType(options.grid_type, id, false);
    if (options?.full_fow !== undefined) settingsStore.setFullFow(options.full_fow, id, false);
    if (options?.fow_opacity !== undefined) settingsStore.setFowOpacity(options.fow_opacity, id, false);
    if (options?.fow_los !== undefined) settingsStore.setLineOfSight(options.fow_los, id, false);
    if (options?.vision_min_range !== undefined) settingsStore.setVisionRangeMin(options.vision_min_range, id, false);
    if (options?.vision_max_range !== undefined) settingsStore.setVisionRangeMax(options.vision_max_range, id, false);
    if (options?.vision_mode !== undefined && options.vision_mode in VisibilityMode) {
        visionState.setVisionMode(VisibilityMode[options.vision_mode as keyof typeof VisibilityMode], false);
    }
    if (options.move_player_on_token_change !== undefined) {
        settingsStore.setMovePlayerOnTokenChange(options.move_player_on_token_change, id, false);
    }
    if (options?.air_map_background !== undefined)
        settingsStore.setAirMapBackground(options.air_map_background, id, false);
    if (options?.ground_map_background !== undefined)
        settingsStore.setGroundMapBackground(options.ground_map_background, id, false);
    if (options?.underground_map_background !== undefined)
        settingsStore.setUndergroundMapBackground(options.underground_map_background, id, false);
    if (id !== undefined) {
        const spawnLocations: GlobalId[] = JSON.parse(options.spawn_locations ?? "[]");
        settingsStore.setSpawnLocations(
            spawnLocations.map((s) => reserveLocalId(s)!),
            id,
            false,
        );
    }
}
