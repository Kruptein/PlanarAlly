import { coreStore } from "../../../core/store";
import { ServerLocation } from "../../comm/types/general";
import { ServerLocationOptions } from "../../comm/types/settings";
import { EventBus } from "../../event-bus";
import { floorStore } from "../../layers/store";
import { gameSettingsStore } from "../../settings";
import { gameStore } from "../../store";
import { VisibilityMode, visibilityStore } from "../../visibility/store";
import { sendLocationRename } from "../emits/location";
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

socket.on("Locations.Order.Set", (locations: { id: number; name: string }[]) => {
    gameStore.setLocations({ locations, sync: false });
});

socket.on("Location.Change.Start", () => {
    coreStore.setLoading(true);
    gameStore.setBoardInitialized(false);
});

socket.on("Location.Rename", (data: { location: number; name: string }) => {
    renameLocation(data.location, data.name);
});

export function setLocationOptions(id: number | null, options: Partial<ServerLocationOptions>): void {
    if (options?.unit_size !== undefined)
        gameSettingsStore.setUnitSize({ unitSize: options.unit_size, location: id, sync: false });
    if (options?.unit_size_unit !== undefined)
        gameSettingsStore.setUnitSizeUnit({ unitSizeUnit: options.unit_size_unit, location: id, sync: false });
    if (options.use_grid !== undefined)
        gameSettingsStore.setUseGrid({ useGrid: options.use_grid, location: id, sync: false });
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
            mode: VisibilityMode[<keyof typeof VisibilityMode>options.vision_mode],
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

export function renameLocation(id: number, name: string): void {
    const idx = gameStore.locations.findIndex(l => l.id === id);
    if (idx < 0) {
        throw new Error("unknown location rename attempt");
    }
    if (gameSettingsStore.activeLocation === id) gameSettingsStore.setActiveLocation(id);
    gameStore.locations.splice(idx, 1, { id, name });
    sendLocationRename({ location: id, name });
}
