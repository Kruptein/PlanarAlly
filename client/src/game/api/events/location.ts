// Bootup Sequence

import { coreStore } from "../../../store/core";
import { gameStore } from "../../../store/game";
import { locationStore } from "../../../store/location";
import { reserveLocalId } from "../../id";
import type { GlobalId } from "../../id";
import type { ServerLocation } from "../../models/general";
import type { Location } from "../../models/settings";
import { playerSystem } from "../../systems/players";
import { locationSettingsSystem } from "../../systems/settings/location";
import type { ServerLocationInfo, ServerLocationOptions } from "../../systems/settings/location/models";
import { visibilityModeFromString, visionState } from "../../vision/state";
import { socket } from "../socket";

socket.on("Location.Set", (data: ServerLocation) => {
    locationSettingsSystem.setActiveLocation(data.id);
    playerSystem.updatePlayersLocation([playerSystem.getCurrentPlayer()!.name], data.id, false);
});

socket.on("Locations.Settings.Set", (data: ServerLocationInfo) => {
    locationSettingsSystem.setActiveLocation(data.active);
    setLocationOptions(undefined, data.default);
    for (const key in data.locations) setLocationOptions(Number.parseInt(key), data.locations[key]);
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

function setLocationOptions(id: number | undefined, options: Partial<ServerLocationOptions>): void {
    // GRID
    locationSettingsSystem.setUseGrid(options.use_grid, id, false);
    locationSettingsSystem.setGridType(options.grid_type, id, false);
    locationSettingsSystem.setUnitSize(options.unit_size, id, false);
    locationSettingsSystem.setUnitSizeUnit(options.unit_size_unit, id, false);

    // VISION

    locationSettingsSystem.setFullFow(options.full_fow, id, false);
    locationSettingsSystem.setFowLos(options.fow_los, id, false);
    locationSettingsSystem.setFowOpacity(options.fow_opacity, id, false);

    const visionMode = options.vision_mode !== undefined ? visibilityModeFromString(options.vision_mode) : undefined;
    if (visionMode !== undefined) visionState.setVisionMode(visionMode, false);

    locationSettingsSystem.setVisionMinRange(options.vision_min_range, id, false);
    locationSettingsSystem.setVisionMaxRange(options.vision_max_range, id, false);

    // FLOOR

    locationSettingsSystem.setAirMapBackground(options.air_map_background, id, false);

    locationSettingsSystem.setGroundMapBackground(options.ground_map_background, id, false);

    locationSettingsSystem.setUndergroundMapBackground(options.underground_map_background, id, false);

    // VARIA

    locationSettingsSystem.setMovePlayerOnTokenChange(options.move_player_on_token_change, id, false);

    // SPAWN LOCATIONS

    if (id !== undefined) {
        const spawnLocations: GlobalId[] = JSON.parse(options.spawn_locations ?? "[]");
        locationSettingsSystem.setSpawnLocations(
            spawnLocations.map((s) => reserveLocalId(s)!),
            id,
            false,
        );
    }
}
