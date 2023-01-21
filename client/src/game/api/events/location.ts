import type {
    ApiLocation,
    ApiOptionalLocationOptions,
    LocationOptionsSet,
    LocationRename,
    LocationSettingsSet,
} from "../../../apiTypes";
import { coreStore } from "../../../store/core";
import { locationStore } from "../../../store/location";
import type { GlobalId } from "../../id";
import type { Location } from "../../models/settings";
import { gameSystem } from "../../systems/game";
import { playerSystem } from "../../systems/players";
import { locationSettingsSystem } from "../../systems/settings/location";
import { visibilityModeFromString, visionState } from "../../vision/state";
import { socket } from "../socket";

socket.on("Location.Set", (data: ApiLocation) => {
    locationSettingsSystem.setActiveLocation(data.id);
    playerSystem.updatePlayersLocation([playerSystem.getCurrentPlayer()!.name], data.id, false);
});

socket.on("Locations.Settings.Set", (data: LocationSettingsSet) => {
    locationSettingsSystem.setActiveLocation(data.active);
    setLocationOptions(undefined, data.default, true);
    for (const key in data.locations) setLocationOptions(Number.parseInt(key), data.locations[key]!, true);
});

// Varia

// This is used to set 1 or more settings, not ALL settings!
socket.on("Location.Options.Set", (data: LocationOptionsSet) => {
    setLocationOptions(data.location ?? undefined, data.options, false);
});

socket.on("Locations.Order.Set", (locations: Location[]) => {
    locationStore.setLocations(locations, false);
});

socket.on("Location.Change.Start", () => {
    coreStore.setLoading(true);
    gameSystem.setBoardInitialized(false);
});

socket.on("Location.Rename", (data: LocationRename) => {
    locationStore.renameLocation(data.location, data.name, false);
});

function _<T>(x: T | undefined | null): x is T {
    return x !== undefined && x !== null;
}

function setLocationOptions(id: number | undefined, options: ApiOptionalLocationOptions, overwrite_all: boolean): void {
    // GRID
    if (overwrite_all || _(options.use_grid))
        locationSettingsSystem.setUseGrid(options.use_grid ?? undefined, id, false);
    if (overwrite_all || _(options.grid_type))
        locationSettingsSystem.setGridType(options.grid_type ?? undefined, id, false);
    if (overwrite_all || _(options.unit_size))
        locationSettingsSystem.setUnitSize(options.unit_size ?? undefined, id, false);
    if (overwrite_all || _(options.unit_size_unit))
        locationSettingsSystem.setUnitSizeUnit(options.unit_size_unit ?? undefined, id, false);

    // VISION

    if (overwrite_all || _(options.full_fow))
        locationSettingsSystem.setFullFow(options.full_fow ?? undefined, id, false);
    if (overwrite_all || _(options.fow_los)) locationSettingsSystem.setFowLos(options.fow_los ?? undefined, id, false);
    if (overwrite_all || _(options.fow_opacity))
        locationSettingsSystem.setFowOpacity(options.fow_opacity ?? undefined, id, false);

    if (overwrite_all || _(options.vision_mode)) {
        const visionMode = _(options.vision_mode) ? visibilityModeFromString(options.vision_mode) : undefined;
        if (visionMode !== undefined) visionState.setVisionMode(visionMode, false);
    }

    if (overwrite_all || _(options.vision_min_range))
        locationSettingsSystem.setVisionMinRange(options.vision_min_range ?? undefined, id, false);
    if (overwrite_all || _(options.vision_max_range))
        locationSettingsSystem.setVisionMaxRange(options.vision_max_range ?? undefined, id, false);

    // FLOOR

    if (overwrite_all || _(options.air_map_background))
        locationSettingsSystem.setAirMapBackground(options.air_map_background ?? undefined, id, false);
    if (overwrite_all || _(options.ground_map_background))
        locationSettingsSystem.setGroundMapBackground(options.ground_map_background ?? undefined, id, false);
    if (overwrite_all || _(options.underground_map_background))
        locationSettingsSystem.setUndergroundMapBackground(options.underground_map_background ?? undefined, id, false);

    // VARIA

    if (overwrite_all || options.move_player_on_token_change !== null)
        locationSettingsSystem.setMovePlayerOnTokenChange(options.move_player_on_token_change ?? undefined, id, false);
    if (overwrite_all || options.limit_movement_during_initiative !== null)
        locationSettingsSystem.setLimitMovementDuringInitiative(
            options.limit_movement_during_initiative ?? undefined,
            id,
            false,
        );

    // SPAWN LOCATIONS

    if (id !== undefined && (overwrite_all || options.spawn_locations !== undefined)) {
        const spawnLocations = JSON.parse(options.spawn_locations ?? "[]") as GlobalId[];
        locationSettingsSystem.setSpawnLocations(spawnLocations, id, false);
    }
}
