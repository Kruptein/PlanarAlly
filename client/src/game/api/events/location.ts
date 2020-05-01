import { ServerLocation } from "../../comm/types/general";
import { layerManager } from "../../layers/manager";
import { gameStore } from "../../store";
import { VisibilityMode, visibilityStore } from "../../visibility/store";
import { socket } from "../socket";

socket.on("Location.Set", (data: Partial<ServerLocation>) => {
    if (data.name !== undefined) gameStore.setLocationName(data.name);
    if (data.unit_size !== undefined) gameStore.setUnitSize({ unitSize: data.unit_size, sync: false });
    if (data.unit_size_unit !== undefined)
        gameStore.setUnitSizeUnit({ unitSizeUnit: data.unit_size_unit, sync: false });
    if (data.use_grid !== undefined) gameStore.setUseGrid({ useGrid: data.use_grid, sync: false });
    if (data.full_fow !== undefined) gameStore.setFullFOW({ fullFOW: data.full_fow, sync: false });
    if (data.fow_opacity !== undefined) gameStore.setFOWOpacity({ fowOpacity: data.fow_opacity, sync: false });
    if (data.fow_los !== undefined) gameStore.setLineOfSight({ fowLOS: data.fow_los, sync: false });
    if (data.vision_min_range !== undefined) gameStore.setVisionRangeMin({ value: data.vision_min_range, sync: false });
    if (data.vision_max_range !== undefined) gameStore.setVisionRangeMax({ value: data.vision_max_range, sync: false });
    if (data.vision_mode !== undefined && data.vision_mode in VisibilityMode) {
        visibilityStore.setVisionMode({
            mode: VisibilityMode[<keyof typeof VisibilityMode>data.vision_mode],
            sync: false,
        });
        for (const floor of layerManager.floors) {
            visibilityStore.recalculateVision(floor.name);
            visibilityStore.recalculateMovement(floor.name);
        }
    }
});

socket.on("Locations.Order.Set", (locations: string[]) => {
    gameStore.setLocations({ locations, sync: false });
});
