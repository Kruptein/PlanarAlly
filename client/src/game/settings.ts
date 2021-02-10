import Vue from "vue";
import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import { toSnakeCase } from "../core/utils";
import { rootStore } from "../store";

import { sendLocationOptions } from "./api/emits/location";
import { layerManager } from "./layers/manager";
import { floorStore } from "./layers/store";
import { LocationOptions } from "./models/settings";

export interface GameSettingsState {
    activeLocation: number;

    defaultLocationOptions: LocationOptions | null;
    locationOptions: Partial<LocationOptions>;

    unitSize: number;
    unitSizeUnit: string;
    useGrid: boolean;
    gridType: string;
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

    get unitSize(): number {
        return this.currentLocationOptions.unitSize ?? this.defaultLocationOptions?.unitSize ?? 0;
    }

    get unitSizeUnit(): string {
        return this.currentLocationOptions.unitSizeUnit ?? this.defaultLocationOptions?.unitSizeUnit ?? "";
    }

    get useGrid(): boolean {
        return this.currentLocationOptions.useGrid ?? this.defaultLocationOptions?.useGrid ?? false;
    }

    get gridType(): string {
        return this.currentLocationOptions.gridType ?? this.defaultLocationOptions?.gridType ?? "SQUARE";
    }

    get fullFow(): boolean {
        return this.currentLocationOptions.fullFow ?? this.defaultLocationOptions?.fullFow ?? false;
    }

    get fowOpacity(): number {
        return this.currentLocationOptions.fowOpacity ?? this.defaultLocationOptions?.fowOpacity ?? 0;
    }

    get fowLos(): boolean {
        return this.currentLocationOptions.fowLos ?? this.defaultLocationOptions?.fowLos ?? false;
    }

    get visionMinRange(): number {
        return this.currentLocationOptions.visionMinRange ?? this.defaultLocationOptions?.visionMinRange ?? 0;
    }

    get visionMaxRange(): number {
        return this.currentLocationOptions.visionMaxRange ?? this.defaultLocationOptions?.visionMaxRange ?? 0;
    }

    get spawnLocations(): string[] {
        return this.currentLocationOptions.spawnLocations ?? [];
    }

    get movePlayerOnTokenChange(): boolean {
        return (
            this.currentLocationOptions.movePlayerOnTokenChange ??
            this.defaultLocationOptions?.movePlayerOnTokenChange ??
            false
        );
    }

    @Mutation
    reset(data: { key: keyof LocationOptions; location: number }): void {
        if (data.key in this.locationOptions[data.location]) {
            Vue.delete(this.locationOptions[data.location], data.key);
            sendLocationOptions({
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
            if (data.sync) sendLocationOptions({ options: { unit_size: data.unitSize }, location: data.location });
        }
    }

    @Mutation
    setUnitSizeUnit(data: { unitSizeUnit: string; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("unitSizeUnit", data.unitSizeUnit, data.location)) {
            layerManager.invalidateAllFloors();
            if (data.sync)
                sendLocationOptions({
                    options: { unit_size_unit: data.unitSizeUnit },
                    location: data.location,
                });
        }
    }

    @Mutation
    setUseGrid(data: { useGrid: boolean; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("useGrid", data.useGrid, data.location)) {
            for (const floor of floorStore.floors) {
                const gridLayer = layerManager.getGridLayer(floor)!;
                if (data.useGrid) gridLayer.canvas.style.display = "block";
                else gridLayer.canvas.style.display = "none";
                gridLayer.invalidate();
            }

            if (data.sync) sendLocationOptions({ options: { use_grid: data.useGrid }, location: data.location });
        }
    }

    @Mutation
    setGridType(data: { gridType: string; location: number | null; sync: boolean }): void {
        if (!["SQUARE", "POINTY_HEX", "FLAT_HEX"].includes(data.gridType)) {
            throw new Error("Unknown grid type set");
        }
        if (mutateLocationOption("gridType", data.gridType, data.location)) {
            for (const floor of floorStore.floors) {
                const gridLayer = layerManager.getGridLayer(floor)!;
                gridLayer.invalidate();
            }

            if (data.sync) sendLocationOptions({ options: { grid_type: data.gridType }, location: data.location });
        }
    }

    @Mutation
    setVisionRangeMin(data: { visionMinRange: number; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("visionMinRange", data.visionMinRange, data.location)) {
            layerManager.invalidateLightAllFloors();
            if (data.sync)
                sendLocationOptions({
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
                sendLocationOptions({
                    options: { vision_max_range: data.visionMaxRange },
                    location: data.location,
                });
        }
    }

    @Mutation
    setFullFow(data: { fullFow: boolean; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("fullFow", data.fullFow, data.location)) {
            layerManager.invalidateLightAllFloors();
            if (data.sync) sendLocationOptions({ options: { full_fow: data.fullFow }, location: data.location });
        }
    }

    @Mutation
    setFowOpacity(data: { fowOpacity: number; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("fowOpacity", data.fowOpacity, data.location)) {
            layerManager.invalidateLightAllFloors();
            if (data.sync)
                sendLocationOptions({
                    options: { fow_opacity: data.fowOpacity },
                    location: data.location,
                });
        }
    }

    @Mutation
    setLineOfSight(data: { fowLos: boolean; location: number | null; sync: boolean }): void {
        if (mutateLocationOption("fowLos", data.fowLos, data.location)) {
            layerManager.invalidateAllFloors();
            if (data.sync) sendLocationOptions({ options: { fow_los: data.fowLos }, location: data.location });
        }
    }

    @Mutation
    setSpawnLocations(data: { spawnLocations: string[]; location: number | null; sync: boolean }): void {
        if (data.location === null) return;
        if (mutateLocationOption("spawnLocations", data.spawnLocations, data.location)) {
            layerManager.invalidateAllFloors();
            if (data.sync)
                sendLocationOptions({
                    options: { spawn_locations: JSON.stringify(data.spawnLocations) },
                    location: data.location,
                });
        }
    }

    @Mutation
    setMovePlayerOnTokenChange(data: {
        movePlayerOnTokenChange: boolean;
        location: number | null;
        sync: boolean;
    }): void {
        if (mutateLocationOption("movePlayerOnTokenChange", data.movePlayerOnTokenChange, data.location)) {
            if (data.sync)
                sendLocationOptions({
                    options: { move_player_on_token_change: data.movePlayerOnTokenChange },
                    location: data.location,
                });
        }
    }
}

export const gameSettingsStore = getModule(GameSettingsStore);
