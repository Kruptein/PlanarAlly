import { coreStore } from "../../../core/store";
import { EventBus } from "../../event-bus";
import { floorStore } from "../../layers/store";
import { ServerLocation } from "../../models/general";
import { Location, ServerLocationOptions } from "../../models/settings";
import { gameSettingsStore } from "../../settings";
import { gameStore } from "../../store";
import { VisibilityMode, visibilityStore } from "../../visibility/store";
import { socket } from "../socket";

// Bootup Sequence

socket.on("Location.Set", (data: ServerLocation) => {
    gameSettingsStore.setActiveLocation(data.id);
    gameStore.updatePlayer({ player: gameStore.username, location: data.id });
    setLocationOptions(data.id, data.options);
    EventBus.$emit("Location.Options.Set");
});

socket.on("Locations.Settings.Set", (data: { [key: number]: Partial<ServerLocationOptions> }) => {
    for (const key in data) setLocationOptions(Number.parseInt(key), data[key]);
});

// Varia

socket.on("Location.Options.Set", (data: { options: Partial<ServerLocationOptions>; location: number | null }) => {
    setLocationOptions(data.location, data.options);
});

socket.on("Locations.Order.Set", (locations: Location[]) => {
    gameStore.setLocations({ locations, sync: false });
});

socket.on("Location.Change.Start", () => {
    coreStore.setLoading(true);
    gameStore.setBoardInitialized(false);
});

socket.on("Location.Rename", (data: { location: number; name: string }) => {
    gameStore.renameLocation({ ...data, sync: false });
});

export function setLocationOptions(id: number | null, options: Partial<ServerLocationOptions>): void {
    if (options?.unit_size !== undefined)
        gameSettingsStore.setUnitSize({ unitSize: options.unit_size, location: id, sync: false });
    if (options?.unit_size_unit !== undefined)
        gameSettingsStore.setUnitSizeUnit({ unitSizeUnit: options.unit_size_unit, location: id, sync: false });
    if (options.use_grid !== undefined)
        gameSettingsStore.setUseGrid({ useGrid: options.use_grid, location: id, sync: false });
    if (options.grid_type !== undefined)
        gameSettingsStore.setGridType({ gridType: options.grid_type, location: id, sync: false });
    if (options?.full_fow !== undefined)
        gameSettingsStore.setFullFow({ fullFow: options.full_fow, location: id, sync: false });
    if (options?.fow_opacity !== undefined)
        gameSettingsStore.setFowOpacity({ fowOpacity: options.fow_opacity, location: id, sync: false });
    if (options?.fow_los !== undefined)
        gameSettingsStore.setLineOfSight({ fowLos: options.fow_los, location: id, sync: false });
    if (options?.vision_min_range !== undefined)
        gameSettingsStore.setVisionRangeMin({ visionMinRange: options.vision_min_range, location: id, sync: false });
    if (options?.vision_max_range !== undefined)
        gameSettingsStore.setVisionRangeMax({ visionMaxRange: options.vision_max_range, location: id, sync: false });
    if (options?.vision_mode && options.vision_mode in VisibilityMode) {
        visibilityStore.setVisionMode({
            mode: VisibilityMode[options.vision_mode as keyof typeof VisibilityMode],
            sync: false,
        });
        for (const floor of floorStore.floors) {
            visibilityStore.recalculateVision(floor.id);
            visibilityStore.recalculateMovement(floor.id);
        }
    }
    if (options.move_player_on_token_change !== undefined) {
        gameSettingsStore.setMovePlayerOnTokenChange({
            movePlayerOnTokenChange: options.move_player_on_token_change,
            location: id,
            sync: false,
        });
    }
    gameSettingsStore.setSpawnLocations({
        spawnLocations: JSON.parse(options.spawn_locations ?? "[]"),
        location: id,
        sync: false,
    });
}
