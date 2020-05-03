import { coreStore } from "../../../core/store";
import { ServerLocation } from "../../comm/types/general";
import { ServerLocationOptions } from "../../comm/types/settings";
import { layerManager } from "../../layers/manager";
import { gameSettingsStore } from "../../settings";
import { gameStore } from "../../store";
import { VisibilityMode, visibilityStore } from "../../visibility/store";
import { socket } from "../socket";

socket.on("Location.Set", (data: ServerLocation) => {
    coreStore.setLoading(false);
    gameSettingsStore.setLocationName(data.name);
    setLocationOptions(data.options, data.name);
});

socket.on("Locations.Order.Set", (locations: string[]) => {
    gameStore.setLocations({ locations, sync: false });
});

socket.on("Location.Change.Start", () => {
    coreStore.setLoading(true);
});

export function setLocationOptions(options: Partial<ServerLocationOptions>, location: string | null): void {
    if (options.grid_size) gameSettingsStore.setGridSize({ gridSize: options.grid_size, location, sync: false });
    if (options.unit_size) gameSettingsStore.setUnitSize({ unitSize: options.unit_size, location, sync: false });
    if (options.unit_size_unit)
        gameSettingsStore.setUnitSizeUnit({ unitSizeUnit: options.unit_size_unit, location, sync: false });
    if (options.use_grid) gameSettingsStore.setUseGrid({ useGrid: options.use_grid, location, sync: false });
    if (options.full_fow) gameSettingsStore.setFullFow({ fullFow: options.full_fow, location, sync: false });
    if (options.fow_opacity)
        gameSettingsStore.setFowOpacity({ fowOpacity: options.fow_opacity, location, sync: false });
    if (options.fow_los) gameSettingsStore.setLineOfSight({ fowLos: options.fow_los, location, sync: false });
    if (options.vision_min_range)
        gameSettingsStore.setVisionRangeMin({ visionMinRange: options.vision_min_range, location, sync: false });
    if (options.vision_max_range)
        gameSettingsStore.setVisionRangeMax({ visionMaxRange: options.vision_max_range, location, sync: false });
    if (options.vision_mode && options.vision_mode in VisibilityMode) {
        visibilityStore.setVisionMode({
            mode: VisibilityMode[<keyof typeof VisibilityMode>options.vision_mode],
            location,
            sync: false,
        });
        for (const floor of layerManager.floors) {
            visibilityStore.recalculateVision(floor.name);
            visibilityStore.recalculateMovement(floor.name);
        }
    }
}
