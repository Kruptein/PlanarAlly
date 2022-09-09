import { computed, ref, watchEffect } from "vue";

import { Store } from "../core/store";
import {
    sendLocationArchive,
    sendLocationClone,
    sendLocationOrder,
    sendLocationRemove,
    sendLocationRename,
    sendLocationUnarchive,
} from "../game/api/emits/location";
import type { Location } from "../game/models/settings";
import { playerSystem } from "../game/systems/players";
import { playerState } from "../game/systems/players/state";
import { locationSettingsSystem } from "../game/systems/settings/location";
import { locationSettingsState } from "../game/systems/settings/location/state";

import { getGameState } from "./_game";

interface LocationState {
    playerLocations: Map<number, Set<string>>;
}

class LocationStore extends Store<LocationState> {
    private locations = ref<Location[]>([]);

    constructor() {
        super();
        watchEffect(() => {
            const state = getGameState();
            const newLocations = new Map();
            for (const player of playerState.reactive.players.values()) {
                if (player.name === playerSystem.getCurrentPlayer()?.name && state.isDm) continue;
                if (!newLocations.has(player.location)) {
                    newLocations.set(player.location, new Set());
                }
                newLocations.get(player.location)!.add(player.name);
            }
            this._state.playerLocations = newLocations;
        });
    }

    protected data(): LocationState {
        return { playerLocations: new Map() };
    }

    activeLocations = computed(() => this.locations.value.filter((l) => !l.archived));
    archivedLocations = computed(() => this.locations.value.filter((l) => l.archived));

    setLocations(locations: Location[], sync: boolean): void {
        this.locations.value = locations;
        if (sync) sendLocationOrder(this.locations.value.map((l) => l.id));
    }

    setActiveLocations(locations: Location[], sync: boolean): void {
        this.locations.value = locations.concat(this.archivedLocations.value);
        if (sync) sendLocationOrder(this.locations.value.map((l) => l.id));
    }

    removeLocation(id: number, sync: boolean): void {
        const idx = this.locations.value.findIndex((l) => l.id === id);
        if (idx >= 0) this.locations.value.splice(idx, 1);
        if (sync) sendLocationRemove(id);
    }

    archiveLocation(id: number, sync: boolean): void {
        const location = this.locations.value.find((l) => l.id === id);
        if (location === undefined) {
            throw new Error("unknown location rename attempt");
        }
        location.archived = true;
        if (sync) sendLocationArchive(id);
    }

    unarchiveLocation(id: number, sync: boolean): void {
        const location = this.locations.value.find((l) => l.id === id);
        if (location === undefined) {
            throw new Error("unknown location rename attempt");
        }
        location.archived = false;
        if (sync) sendLocationUnarchive(id);
    }

    renameLocation(id: number, name: string, sync: boolean): void {
        const location = this.locations.value.find((l) => l.id === id);
        if (location === undefined) {
            throw new Error("unknown location rename attempt");
        }
        if (locationSettingsState.raw.activeLocation === id) locationSettingsSystem.setActiveLocation(id);
        location.name = name;
        if (sync) sendLocationRename({ location: id, name });
    }

    cloneLocation(id: number, room: string, sync: boolean): void {
        const location = this.locations.value.find((l) => l.id === id);
        if (location === undefined) {
            throw new Error("unknown location clone attempt");
        }
        if (sync) sendLocationClone({ location: id, room });
    }
}

export const locationStore = new LocationStore();
(window as any).locationStore = locationStore;
