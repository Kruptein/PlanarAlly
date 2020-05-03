import { Module, Mutation, VuexModule, getModule } from "vuex-module-decorators";

import { rootStore } from "../store";
import { socket } from "./api/socket";
import { LocationOptions } from "./comm/types/settings";
import { layerManager } from "./layers/manager";

export interface GameSettingsState {
    locationName: string;

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

@Module({ dynamic: true, store: rootStore, name: "gameSettings", namespaced: true })
class GameSettingsStore extends VuexModule implements GameSettingsState {
    locationName = "";

    defaultLocationOptions: LocationOptions | null = null;
    locationOptions: Partial<LocationOptions> = {};

    get gridSize(): number {
        return this.locationOptions?.gridSize ?? this.defaultLocationOptions!.gridSize;
    }

    get unitSize(): number {
        return this.locationOptions?.unitSize ?? this.defaultLocationOptions!.unitSize;
    }

    get unitSizeUnit(): string {
        return this.locationOptions?.unitSizeUnit ?? this.defaultLocationOptions!.unitSizeUnit;
    }
    get useGrid(): boolean {
        return this.locationOptions?.useGrid ?? this.defaultLocationOptions!.useGrid;
    }
    get fullFow(): boolean {
        return this.locationOptions?.fullFow ?? this.defaultLocationOptions!.fullFow;
    }
    get fowOpacity(): number {
        return this.locationOptions?.fowOpacity ?? this.defaultLocationOptions!.fowOpacity;
    }
    get fowLos(): boolean {
        return this.locationOptions?.fowLos ?? this.defaultLocationOptions!.fowLos;
    }
    get visionMinRange(): number {
        return this.locationOptions?.visionMinRange ?? this.defaultLocationOptions!.visionMinRange;
    }
    get visionMaxRange(): number {
        return this.locationOptions?.visionMaxRange ?? this.defaultLocationOptions!.visionMaxRange;
    }

    @Mutation
    setLocationName(name: string): void {
        this.locationName = name;
    }

    @Mutation
    setDefaultLocationOptions(data: LocationOptions): void {
        this.defaultLocationOptions = data;
    }

    @Mutation
    setUnitSize(data: { unitSize: number; location: string | null; sync: boolean }): void {
        if (this.mutateLocationOption("unitSize", data.unitSize, data.location)) {
            layerManager.invalidateAllFloors();
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { unit_size: data.unitSize, location: data.location });
        }
    }

    @Mutation
    setUnitSizeUnit(data: { unitSizeUnit: string; location: string | null; sync: boolean }): void {
        if (this.mutateLocationOption("unitSizeUnit", data.unitSizeUnit, data.location)) {
            layerManager.invalidateAllFloors();
            if (data.sync)
                // eslint-disable-next-line @typescript-eslint/camelcase
                socket.emit("Location.Options.Set", { unit_size_unit: data.unitSizeUnit, location: data.location });
        }
    }

    @Mutation
    setUseGrid(data: { useGrid: boolean; location: string | null; sync: boolean }): void {
        if (this.mutateLocationOption("useGrid", data.useGrid, data.location)) {
            for (const floor of layerManager.floors) {
                const gridLayer = layerManager.getGridLayer(floor.name)!;
                if (data.useGrid) gridLayer.canvas.style.display = "block";
                else gridLayer.canvas.style.display = "none";
                gridLayer.invalidate();
            }

            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { use_grid: data.useGrid, location: data.location });
        }
    }

    @Mutation
    setGridSize(data: { gridSize: number; location: string | null; sync: boolean }): void {
        if (this.mutateLocationOption("gridSize", data.gridSize, data.location)) {
            for (const floor of layerManager.floors) {
                const gridLayer = layerManager.getGridLayer(floor.name);
                if (gridLayer !== undefined) gridLayer.invalidate();
            }

            if (data.sync) socket.emit("Location.Options.Set", { gridSize: data.gridSize, location: data.location });
        }
    }

    @Mutation
    setVisionRangeMin(data: { visionMinRange: number; location: string | null; sync: boolean }): void {
        if (this.mutateLocationOption("visionMinRange", data.visionMinRange, data.location)) {
            layerManager.invalidateLightAllFloors();
            if (data.sync)
                // eslint-disable-next-line @typescript-eslint/camelcase
                socket.emit("Location.Options.Set", { vision_min_range: data.visionMinRange, location: data.location });
        }
    }

    @Mutation
    setVisionRangeMax(data: { visionMaxRange: number; location: string | null; sync: boolean }): void {
        if (this.mutateLocationOption("visionMaxRange", data.visionMaxRange, data.location)) {
            layerManager.invalidateLightAllFloors();
            if (data.sync)
                // eslint-disable-next-line @typescript-eslint/camelcase
                socket.emit("Location.Options.Set", { vision_max_range: data.visionMaxRange, location: data.location });
        }
    }

    @Mutation
    setFullFow(data: { fullFow: boolean; location: string | null; sync: boolean }): void {
        if (this.mutateLocationOption("fullFow", data.fullFow, data.location)) {
            layerManager.invalidateLightAllFloors();
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { full_fow: data.fullFow, location: data.location });
        }
    }

    @Mutation
    setFowOpacity(data: { fowOpacity: number; location: string | null; sync: boolean }): void {
        if (this.mutateLocationOption("fowOpacity", data.fowOpacity, data.location)) {
            layerManager.invalidateLightAllFloors();
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync)
                socket.emit("Location.Options.Set", { fow_opacity: data.fowOpacity, location: data.location });
        }
    }

    @Mutation
    setLineOfSight(data: { fowLos: boolean; location: string | null; sync: boolean }): void {
        if (this.mutateLocationOption("fowLos", data.fowLos, data.location)) {
            layerManager.invalidateAllFloors();
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { fow_los: data.fowLos, location: data.location });
        }
    }

    mutateLocationOption<K extends keyof LocationOptions>(
        key: K,
        value: LocationOptions[K],
        location: string | null,
    ): boolean {
        if (location === null) {
            if (this.defaultLocationOptions![key] !== value) {
                this.defaultLocationOptions![key] = value;
                return true;
            }
        } else if (location === this.locationName) {
            if (this.locationOptions[key] !== value) {
                this.locationOptions[key] = value;
                return true;
            }
        } else {
            return true;
        }
        return false;
    }
}

export const gameSettingsStore = getModule(GameSettingsStore);
