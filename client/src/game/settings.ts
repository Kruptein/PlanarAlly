import Vue from "vue";
import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { InvalidationMode, SyncMode } from "../core/comm/types";
import { toSnakeCase, uuidv4 } from "../core/utils";
import { rootStore } from "../store";
import { socket } from "./api/socket";
import { LocationOptions } from "./comm/types/settings";
import { layerManager } from "./layers/manager";
import { Asset } from "./shapes/asset";
import { gameStore } from "./store";

export interface GameSettingsState {
    activeLocation: number;

    defaultLocationOptions: LocationOptions | null;
    locationOptions: Partial<LocationOptions>;

    gridSize: number;
    unitSize: number;
    unitSizeUnit: string;
    useGrid: boolean;
    fullFow: boolean;
    fowOpacity: number;
    fowLos: boolean;
    visionMinRange: number;
    visionMaxRange: number;
}

function mutateLocationOption<K extends keyof LocationOptions>(
    key: K,
    value: LocationOptions[K],
    location: number | null,
): boolean {
    if (location === null) {
        if (gameSettingsStore.defaultLocationOptions![key] !== value) {
            gameSettingsStore.defaultLocationOptions![key] = value;
            return true;
        }
    } else {
        if (gameSettingsStore.locationOptions[location] === undefined) {
            Vue.set(gameSettingsStore.locationOptions, location, {});
        }
        if (gameSettingsStore.locationOptions[location][key] !== value) {
            if (gameSettingsStore.locationOptions[location][key] === undefined) {
                Vue.set(gameSettingsStore.locationOptions[location], key, value);
            } else {
                gameSettingsStore.locationOptions[location][key] = value;
            }
            return true;
        }
    }
    return false;
}

export function getLocationOption<K extends keyof LocationOptions>(
    key: K,
    location: number | null,
): Partial<LocationOptions>[K] {
    if (location === null) return gameSettingsStore.defaultLocationOptions![key];
    return gameSettingsStore.locationOptions[location]?.[key] ?? gameSettingsStore.defaultLocationOptions![key];
}

@Module({ dynamic: true, store: rootStore, name: "gameSettings", namespaced: true })
class GameSettingsStore extends VuexModule implements GameSettingsState {
    activeLocation = 0;

    defaultLocationOptions: LocationOptions | null = null;
    locationOptions: { [key: number]: Partial<LocationOptions> } = {};

    get currentLocationOptions(): Partial<LocationOptions> {
        return this.locationOptions[this.activeLocation];
    }

    get gridSize(): number {
        return this.currentLocationOptions?.gridSize ?? this.defaultLocationOptions?.gridSize ?? 0;
    }

    get unitSize(): number {
        return this.currentLocationOptions?.unitSize ?? this.defaultLocationOptions?.unitSize ?? 0;
    }

    get unitSizeUnit(): string {
        return this.currentLocationOptions?.unitSizeUnit ?? this.defaultLocationOptions?.unitSizeUnit ?? "";
    }
    get useGrid(): boolean {
        return this.currentLocationOptions?.useGrid ?? this.defaultLocationOptions?.useGrid ?? false;
    }
    get fullFow(): boolean {
        return this.currentLocationOptions?.fullFow ?? this.defaultLocationOptions?.fullFow ?? false;
    }
    get fowOpacity(): number {
        return this.currentLocationOptions?.fowOpacity ?? this.defaultLocationOptions?.fowOpacity ?? 0;
    }
    get fowLos(): boolean {
        return this.currentLocationOptions?.fowLos ?? this.defaultLocationOptions?.fowLos ?? false;
    }
    get visionMinRange(): number {
        return this.currentLocationOptions?.visionMinRange ?? this.defaultLocationOptions?.visionMinRange ?? 0;
    }
    get visionMaxRange(): number {
        return this.currentLocationOptions?.visionMaxRange ?? this.defaultLocationOptions?.visionMaxRange ?? 0;
    }

    @Mutation
    reset(data: { key: keyof LocationOptions; location: number }): void {
        if (data.key in this.locationOptions[data.location]) {
            Vue.delete(this.locationOptions[data.location], data.key);
            socket.emit("Location.Options.Set", {
                options: { [toSnakeCase(data.key)]: null },
                location: data.location,
            });
        }
    }

    @Mutation
    setActiveLocation(location: number): void {
        this.activeLocation = location;
    }

    @Mutation
    setDefaultLocationOptions(data: LocationOptions): void {
        this.defaultLocationOptions = data;
    }

    @Mutation
    setUnitSize(data: { unitSize: number; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("unitSize", data.unitSize, data.location)) {
            layerManager.invalidateAllFloors();
            if (data.sync)
                // eslint-disable-next-line @typescript-eslint/camelcase
                socket.emit("Location.Options.Set", { options: { unit_size: data.unitSize }, location: data.location });
        }
    }

    @Mutation
    setUnitSizeUnit(data: { unitSizeUnit: string; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("unitSizeUnit", data.unitSizeUnit, data.location)) {
            layerManager.invalidateAllFloors();
            if (data.sync)
                socket.emit("Location.Options.Set", {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    options: { unit_size_unit: data.unitSizeUnit },
                    location: data.location,
                });
        }
    }

    @Mutation
    setUseGrid(data: { useGrid: boolean; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("useGrid", data.useGrid, data.location)) {
            for (const floor of layerManager.floors) {
                const gridLayer = layerManager.getGridLayer(floor.name)!;
                if (data.useGrid) gridLayer.canvas.style.display = "block";
                else gridLayer.canvas.style.display = "none";
                gridLayer.invalidate();
            }

            if (data.sync)
                // eslint-disable-next-line @typescript-eslint/camelcase
                socket.emit("Location.Options.Set", { options: { use_grid: data.useGrid }, location: data.location });
        }
    }

    @Mutation
    setGridSize(data: { gridSize: number; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("gridSize", data.gridSize, data.location)) {
            for (const floor of layerManager.floors) {
                const gridLayer = layerManager.getGridLayer(floor.name);
                if (gridLayer !== undefined) gridLayer.invalidate();
            }

            if (data.sync)
                // eslint-disable-next-line @typescript-eslint/camelcase
                socket.emit("Location.Options.Set", { options: { grid_size: data.gridSize }, location: data.location });
        }
    }

    @Mutation
    setVisionRangeMin(data: { visionMinRange: number; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("visionMinRange", data.visionMinRange, data.location)) {
            layerManager.invalidateLightAllFloors();
            if (data.sync)
                socket.emit("Location.Options.Set", {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    options: { vision_min_range: data.visionMinRange },
                    location: data.location,
                });
        }
    }

    @Mutation
    setVisionRangeMax(data: { visionMaxRange: number; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("visionMaxRange", data.visionMaxRange, data.location)) {
            layerManager.invalidateLightAllFloors();
            if (data.sync)
                socket.emit("Location.Options.Set", {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    options: { vision_max_range: data.visionMaxRange },
                    location: data.location,
                });
        }
    }

    @Mutation
    setFullFow(data: { fullFow: boolean; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("fullFow", data.fullFow, data.location)) {
            layerManager.invalidateLightAllFloors();
            if (data.sync)
                // eslint-disable-next-line @typescript-eslint/camelcase
                socket.emit("Location.Options.Set", { options: { full_fow: data.fullFow }, location: data.location });
        }
    }

    @Mutation
    setFowOpacity(data: { fowOpacity: number; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("fowOpacity", data.fowOpacity, data.location)) {
            layerManager.invalidateLightAllFloors();
            if (data.sync)
                socket.emit("Location.Options.Set", {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    options: { fow_opacity: data.fowOpacity },
                    location: data.location,
                });
        }
    }

    @Mutation
    setLineOfSight(data: { fowLos: boolean; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("fowLos", data.fowLos, data.location)) {
            layerManager.invalidateAllFloors();
            if (data.sync)
                // eslint-disable-next-line @typescript-eslint/camelcase
                socket.emit("Location.Options.Set", { options: { fow_los: data.fowLos }, location: data.location });
        }
    }

    @Mutation
    async setSpawnLocations(data: { spawnLocations: string[]; location: number | null; sync: boolean }): Promise<void> {
        if (
            data.location === null ||
            (data.spawnLocations.length === 0 && (this.locationOptions[data.location]?.spawnLocations?.length ?? 0) > 1)
        )
            return;
        if (mutateLocationOption("spawnLocations", data.spawnLocations, data.location)) {
            layerManager.invalidateAllFloors();
            if (data.sync)
                socket.emit("Location.Options.Set", {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    options: { spawn_locations: JSON.stringify(data.spawnLocations) },
                    location: data.location,
                });
        }

        if ((this.locationOptions[data.location].spawnLocations?.length ?? 0) === 0) {
            if (gameSettingsStore.activeLocation === 0) {
                await new Promise(resolve => socket.once("Client.Options.Set", resolve));
            }
            if (gameSettingsStore.activeLocation !== data.location) return;

            const uuid = uuidv4();

            const img = new Image(64, 64);
            img.src = "/static/img/spawn.png";

            const shape = new Asset(img, gameStore.screenCenter, 50, 50, uuid);
            shape.name = "Default";
            shape.src = img.src;

            layerManager
                .getLayer(layerManager.getFloor()!.name, "dm")!
                .addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO, false);
            img.onload = () => {
                layerManager.getLayer(shape.floor, shape.layer)!.invalidate(true);
            };

            gameSettingsStore.setSpawnLocations({
                spawnLocations: [uuid],
                location: data.location,
                sync: true,
            });
        }
    }
}

export const gameSettingsStore = getModule(GameSettingsStore);
