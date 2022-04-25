import { computed } from "vue";
import type { ComputedRef } from "vue";

import { Store } from "../core/store";
import { getValueOrDefault } from "../core/types";
import { toSnakeCase } from "../core/utils";
import { sendLocationOptions } from "../game/api/emits/location";
import { getGlobalId } from "../game/id";
import type { LocalId } from "../game/id";
import type { LocationOptions } from "../game/models/settings";

import { floorStore } from "./floor";

const defaultLocationOptions: LocationOptions = {
    fowLos: false,
    fowOpacity: 0,
    gridType: "SQUARE",
    fullFow: false,
    movePlayerOnTokenChange: false,
    spawnLocations: [],
    useGrid: false,
    unitSize: 0,
    unitSizeUnit: "ft",
    visionMaxRange: 0,
    visionMinRange: 0,
    visionMode: "",

    airMapBackground: null,
    groundMapBackground: null,
    undergroundMapBackground: null,
};

interface SettingsState {
    activeLocation: number;
    defaultLocationOptions: LocationOptions | undefined;
    locationOptions: Map<number, Partial<LocationOptions>>;
}

class SettingsStore extends Store<SettingsState> {
    currentLocationOptions: ComputedRef<Partial<LocationOptions>>;

    fowLos: ComputedRef<boolean>;
    fowOpacity: ComputedRef<number>;
    fullFow: ComputedRef<boolean>;
    gridType: ComputedRef<string>;
    movePlayerOnTokenChange: ComputedRef<boolean>;
    spawnLocations: ComputedRef<LocalId[]>;
    unitSize: ComputedRef<number>;
    unitSizeUnit: ComputedRef<string>;
    useGrid: ComputedRef<boolean>;
    visionMaxRange: ComputedRef<number>;
    visionMinRange: ComputedRef<number>;

    airMapBackground: ComputedRef<string | null>;
    groundMapBackground: ComputedRef<string | null>;
    undergroundMapBackground: ComputedRef<string | null>;

    constructor() {
        super();
        this.currentLocationOptions = computed(() => this._state.locationOptions.get(this._state.activeLocation)!);

        this.fowLos = this._("fowLos");
        this.fowOpacity = this._("fowOpacity");
        this.fullFow = this._("fullFow");
        this.gridType = this._("gridType");
        this.movePlayerOnTokenChange = this._("movePlayerOnTokenChange");
        this.spawnLocations = this._("spawnLocations");
        this.unitSize = this._("unitSize");
        this.unitSizeUnit = this._("unitSizeUnit");
        this.useGrid = this._("useGrid");
        this.visionMaxRange = this._("visionMaxRange");
        this.visionMinRange = this._("visionMinRange");

        this.airMapBackground = this._("airMapBackground");
        this.groundMapBackground = this._("groundMapBackground");
        this.undergroundMapBackground = this._("undergroundMapBackground");
    }

    protected data(): SettingsState {
        return {
            activeLocation: 0,
            defaultLocationOptions,
            locationOptions: new Map(),
        };
    }

    private _<K extends keyof LocationOptions>(key: K): ComputedRef<LocationOptions[K]> {
        return computed(() =>
            getValueOrDefault(
                this._state.locationOptions.get(this._state.activeLocation),
                key,
                this._state.defaultLocationOptions?.[key] ?? defaultLocationOptions[key],
            ),
        );
    }

    private mutate<K extends keyof LocationOptions>(key: K, value: LocationOptions[K], location?: number): boolean {
        if (location === undefined) {
            if (this._state.defaultLocationOptions![key] !== value) {
                this._state.defaultLocationOptions![key] = value;
                return true;
            }
        } else {
            if (!this._state.locationOptions.has(location)) {
                this._state.locationOptions.set(location, {});
            }
            const options = this._state.locationOptions.get(location)!;
            if (options[key] !== value) {
                options[key] = value;
                return true;
            }
        }
        return false;
    }

    getLocationOptions<K extends keyof LocationOptions>(key: K, location: number | undefined): LocationOptions[K] {
        if (location === undefined) return this._state.defaultLocationOptions![key];
        return getValueOrDefault(
            this._state.locationOptions.get(location),
            key,
            this._state.defaultLocationOptions![key],
        );
    }

    reset(key: keyof LocationOptions, location: number): void {
        const options = this._state.locationOptions.get(location)!;
        if (key in options) {
            delete options[key];
            sendLocationOptions({
                options: { [toSnakeCase(key)]: null },
                location: location,
            });

            if (
                [
                    "fowLos",
                    "spawnLocations",
                    "unitSize",
                    "visionMinRange",
                    "visionMaxRange",
                    "airMapBackground",
                    "groundMapBackground",
                    "undergroundMapBackground",
                ].includes(key)
            ) {
                floorStore.invalidateAllFloors();
            } else if (["fullFow", "fowOpacity"].includes(key)) {
                floorStore.invalidateLightAllFloors();
            } else if (key === "gridType") {
                for (const floor of floorStore.state.floors) {
                    const gridLayer = floorStore.getGridLayer(floor)!;
                    gridLayer.invalidate();
                }
            } else if (key === "useGrid") {
                for (const floor of floorStore.state.floors) {
                    const gridLayer = floorStore.getGridLayer(floor)!;
                    if (this.useGrid.value) gridLayer.canvas.style.display = "block";
                    else gridLayer.canvas.style.display = "none";
                    gridLayer.invalidate();
                }
            }
        }
    }

    setDefaultLocationOptions(data: LocationOptions): void {
        this._state.defaultLocationOptions = data;
    }

    setActiveLocation(location: number): void {
        this._state.activeLocation = location;
    }

    setLineOfSight(lineOfSight: boolean, location: number | undefined, sync: boolean): void {
        if (this.mutate("fowLos", lineOfSight, location)) {
            floorStore.invalidateAllFloors();
            if (sync) sendLocationOptions({ options: { fow_los: lineOfSight }, location });
        }
    }

    setSpawnLocations(spawnLocations: LocalId[], location: number, sync: boolean): void {
        if (this.mutate("spawnLocations", spawnLocations, location)) {
            floorStore.invalidateAllFloors();
            if (sync)
                sendLocationOptions({
                    options: { spawn_locations: JSON.stringify(spawnLocations.map((s) => getGlobalId(s))) },
                    location,
                });
        }
    }

    setGridType(gridType: string, location: number | undefined, sync: boolean): void {
        if (gridType !== null && !["SQUARE", "POINTY_HEX", "FLAT_HEX"].includes(gridType)) {
            throw new Error("Unknown grid type set");
        }
        if (this.mutate("gridType", gridType, location)) {
            for (const floor of floorStore.state.floors) {
                const gridLayer = floorStore.getGridLayer(floor)!;
                gridLayer.invalidate();
            }

            if (sync) sendLocationOptions({ options: { grid_type: gridType }, location });
        }
    }

    setUnitSize(unitSize: number, location: number | undefined, sync: boolean): void {
        if (this.mutate("unitSize", unitSize, location)) {
            floorStore.invalidateAllFloors();
            if (sync) sendLocationOptions({ options: { unit_size: unitSize }, location: location });
        }
    }

    setUnitSizeUnit(unitSizeUnit: string, location: number | undefined, sync: boolean): void {
        if (this.mutate("unitSizeUnit", unitSizeUnit, location)) {
            floorStore.invalidateAllFloors();
            if (sync)
                sendLocationOptions({
                    options: { unit_size_unit: unitSizeUnit },
                    location,
                });
        }
    }

    setUseGrid(useGrid: boolean, location: number | undefined, sync: boolean): void {
        if (this.mutate("useGrid", useGrid, location)) {
            for (const floor of floorStore.state.floors) {
                const gridLayer = floorStore.getGridLayer(floor)!;
                if (useGrid) gridLayer.canvas.style.display = "block";
                else gridLayer.canvas.style.display = "none";
                gridLayer.invalidate();
            }

            if (sync) sendLocationOptions({ options: { use_grid: useGrid }, location });
        }
    }

    setFullFow(fullFow: boolean, location: number | undefined, sync: boolean): void {
        if (this.mutate("fullFow", fullFow, location)) {
            floorStore.invalidateLightAllFloors();
            if (sync) sendLocationOptions({ options: { full_fow: fullFow }, location });
        }
    }

    setFowOpacity(fowOpacity: number, location: number | undefined, sync: boolean): void {
        if (this.mutate("fowOpacity", fowOpacity, location)) {
            floorStore.invalidateLightAllFloors();
            if (sync)
                sendLocationOptions({
                    options: { fow_opacity: fowOpacity },
                    location,
                });
        }
    }

    setVisionRangeMin(visionMinRange: number, location: number | undefined, sync: boolean): void {
        if (this.mutate("visionMinRange", visionMinRange, location)) {
            floorStore.invalidateLightAllFloors();
            if (sync)
                sendLocationOptions({
                    options: { vision_min_range: visionMinRange },
                    location: location,
                });
        }
    }

    setVisionRangeMax(visionMaxRange: number, location: number | undefined, sync: boolean): void {
        if (this.mutate("visionMaxRange", visionMaxRange, location)) {
            floorStore.invalidateLightAllFloors();
            if (sync)
                sendLocationOptions({
                    options: { vision_max_range: visionMaxRange },
                    location: location,
                });
        }
    }

    setMovePlayerOnTokenChange(movePlayerOnTokenChange: boolean, location: number | undefined, sync: boolean): void {
        if (this.mutate("movePlayerOnTokenChange", movePlayerOnTokenChange, location)) {
            if (sync)
                sendLocationOptions({
                    options: { move_player_on_token_change: movePlayerOnTokenChange },
                    location,
                });
        }
    }

    setAirMapBackground(airMapBackground: string | null, location: number | undefined, sync: boolean): void {
        if (this.mutate("airMapBackground", airMapBackground, location)) {
            floorStore.invalidateAllFloors();
            if (sync)
                sendLocationOptions({
                    options: { air_map_background: airMapBackground },
                    location,
                });
        }
    }

    setGroundMapBackground(groundMapBackground: string | null, location: number | undefined, sync: boolean): void {
        if (this.mutate("groundMapBackground", groundMapBackground, location)) {
            floorStore.invalidateAllFloors();
            if (sync)
                sendLocationOptions({
                    options: { ground_map_background: groundMapBackground },
                    location,
                });
        }
    }

    setUndergroundMapBackground(
        undergroundMapBackground: string | null,
        location: number | undefined,
        sync: boolean,
    ): void {
        if (this.mutate("undergroundMapBackground", undergroundMapBackground, location)) {
            floorStore.invalidateAllFloors();
            if (sync)
                sendLocationOptions({
                    options: { underground_map_background: undergroundMapBackground },
                    location,
                });
        }
    }
}

export const settingsStore = new SettingsStore();
(window as any).settingsStore = settingsStore;
