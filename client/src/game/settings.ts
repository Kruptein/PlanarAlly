import { Module, Mutation, VuexModule, getModule } from "vuex-module-decorators";

import { rootStore } from "../store";
import { socket } from "./api/socket";
import { LocationOptions } from "./comm/types/settings";
import { layerManager } from "./layers/manager";

@Module({ dynamic: true, store: rootStore, name: "game", namespaced: true })
class GameSettingsStore extends VuexModule {
    locationName!: string;

    defaultLocationOptions!: LocationOptions;

    gridSize!: number;
    unitSize!: number;
    unitSizeUnit!: string;
    useGrid!: boolean;
    fullFOW!: boolean;
    fowOpacity!: number;
    fowLOS!: boolean;
    visionRangeMin!: number;
    visionRangeMax!: number;

    @Mutation
    setLocationName(name: string): void {
        this.locationName = name;
    }

    @Mutation
    setUnitSize(data: { unitSize: number; location: string | null; sync: boolean }): void {
        const _default = data.location === null;
        if (this.unitSize !== data.unitSize && data.unitSize > 0 && data.unitSize < Infinity) {
            if (
                this.unitSize === undefined ||
                (!_default && data.location === this.locationName) ||
                (_default && this.unitSize === this.defaultLocationOptions.unitSize)
            )
                this.unitSize = data.unitSize;
            if (_default) this.defaultLocationOptions.unitSize = data.unitSize;
            layerManager.invalidateAllFloors();
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { unit_size: data.unitSize, location: data.location });
        }
    }

    @Mutation
    setUnitSizeUnit(data: { unitSizeUnit: string; location: string | null; sync: boolean }): void {
        const _default = data.location === null;
        if (this.unitSizeUnit !== data.unitSizeUnit) {
            if (
                this.unitSizeUnit === undefined ||
                (!_default && data.location === this.locationName) ||
                (_default && this.unitSizeUnit === this.defaultLocationOptions.unitSizeUnit)
            )
                this.unitSizeUnit = data.unitSizeUnit;
            if (_default) this.defaultLocationOptions.unitSizeUnit = data.unitSizeUnit;
            layerManager.invalidateAllFloors();
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { unit_size_unit: data.unitSizeUnit });
        }
    }

    @Mutation
    setUseGrid(data: { useGrid: boolean; location: string | null; sync: boolean }): void {
        const _default = data.location === null;
        if (this.useGrid !== data.useGrid) {
            this.useGrid = data.useGrid;
            for (const floor of layerManager.floors) {
                const gridLayer = layerManager.getGridLayer(floor.name)!;
                if (data.useGrid) gridLayer.canvas.style.display = "block";
                else gridLayer.canvas.style.display = "none";
                gridLayer.invalidate();
            }
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { use_grid: data.useGrid });
        }
    }

    @Mutation
    setDefaultLocationOptions(data: LocationOptions): void {
        this.defaultLocationOptions = data;
    }

    @Mutation
    setGridSize(data: { gridSize: number; location: string | null; sync: boolean }): void {
        const _default = data.location === null;
        if (this.gridSize !== data.gridSize && data.gridSize > 0) {
            this.gridSize = data.gridSize;
            for (const floor of layerManager.floors) {
                const gridLayer = layerManager.getGridLayer(floor.name);
                if (gridLayer !== undefined) gridLayer.invalidate();
            }
            if (data.sync) socket.emit("Location.Options.Set", { gridSize: data.gridSize, location: data.location });
        }
    }

    @Mutation
    setVisionRangeMin(data: { value: number; location: string | null; sync: boolean }): void {
        const _default = data.location === null;
        this.visionRangeMin = data.value;
        layerManager.invalidateLightAllFloors();
        // eslint-disable-next-line @typescript-eslint/camelcase
        if (data.sync) socket.emit("Location.Options.Set", { vision_min_range: data.value });
    }

    @Mutation
    setVisionRangeMax(data: { value: number; location: string | null; sync: boolean }): void {
        const _default = data.location === null;
        this.visionRangeMax = Math.max(data.value, this.visionRangeMin);
        layerManager.invalidateLightAllFloors();
        // eslint-disable-next-line @typescript-eslint/camelcase
        if (data.sync) socket.emit("Location.Options.Set", { vision_max_range: this.visionRangeMax });
    }

    @Mutation
    setFullFOW(data: { fullFOW: boolean; location: string | null; sync: boolean }): void {
        const _default = data.location === null;
        if (this.fullFOW !== data.fullFOW) {
            this.fullFOW = data.fullFOW;
            layerManager.invalidateLightAllFloors();
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { full_fow: data.fullFOW });
        }
    }

    @Mutation
    setFOWOpacity(data: { fowOpacity: number; location: string | null; sync: boolean }): void {
        const _default = data.location === null;
        this.fowOpacity = data.fowOpacity;
        layerManager.invalidateLightAllFloors();
        // eslint-disable-next-line @typescript-eslint/camelcase
        if (data.sync) socket.emit("Location.Options.Set", { fow_opacity: data.fowOpacity });
    }

    @Mutation
    setLineOfSight(data: { fowLOS: boolean; location: string | null; sync: boolean }): void {
        const _default = data.location === null;
        if (this.fowLOS !== data.fowLOS) {
            this.fowLOS = data.fowLOS;
            layerManager.invalidateAllFloors();
            // eslint-disable-next-line @typescript-eslint/camelcase
            if (data.sync) socket.emit("Location.Options.Set", { fow_los: data.fowLOS });
        }
    }
}

export const gameSettingsStore = getModule(GameSettingsStore);
