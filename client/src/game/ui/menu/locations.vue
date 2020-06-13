<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { mapState } from "vuex";
import { Prop, Watch } from "vue-property-decorator";

import Game from "@/game/game.vue";

import { gameStore } from "@/game/store";
import { socket } from "@/game/api/socket";
import { coreStore } from "../../../core/store";
import { EventBus } from "../../event-bus";

@Component({
    computed: {
        ...mapState("game", ["IS_DM"]),
        ...mapState("gameSettings", ["activeLocation"]),
    },
})
export default class LocationBar extends Vue {
    @Prop() active!: boolean;

    @Watch("active")
    toggleActive(active: boolean): void {
        for (const expandEl of (<any>this.$refs.locations).$el.querySelectorAll(".player-collapse-content")) {
            const hEl = <HTMLElement>expandEl;
            if (this.expanded.includes(Number.parseInt(hEl.dataset.loc || "-1"))) {
                if (active) {
                    expandEl.style.removeProperty("display");
                } else {
                    expandEl.style.display = "none";
                }
            }
        }
    }

    expanded: number[] = [];
    horizontalOffset = 0;

    changeLocation(id: number): void {
        socket.emit("Location.Change", { location: id, users: [gameStore.username] });
        coreStore.setLoading(true);
    }

    get locations(): { id: number; name: string }[] {
        return gameStore.locations;
    }

    set locations(locations: { id: number; name: string }[]) {
        gameStore.setLocations({ locations, sync: true });
    }

    get playerLocations(): Map<number, string[]> {
        const map: Map<number, string[]> = new Map();
        for (const player of gameStore.players) {
            if (player.name === gameStore.username && gameStore.IS_DM) continue;
            if (!map.has(player.location)) map.set(player.location, []);
            map.get(player.location)!.push(player.name);
        }
        return map;
    }

    async createLocation(): Promise<void> {
        const value = await (<Game>this.$parent.$parent).$refs.prompt.prompt(
            this.$t("game.ui.menu.locations.new_location_name").toString(),
            this.$t("game.ui.menu.locations.create_new_location").toString(),
        );
        socket.emit("Location.New", value);
    }

    openLocationSettings(location: string): void {
        EventBus.$emit("LocationSettings.Open", location);
    }

    toggleExpanded(id: number): void {
        const idx = this.expanded.indexOf(id);
        if (idx < 0) this.expanded.push(id);
        else this.expanded.splice(idx, 1);
    }

    endLocationDrag(e: { item: HTMLDivElement }): void {
        e.item.style.removeProperty("transform");
    }

    endPlayersDrag(e: { item: HTMLDivElement; clone: HTMLDivElement; from: HTMLDivElement; to: HTMLDivElement }): void {
        e.item.style.removeProperty("transform");
        const fromLocation = Number.parseInt(e.from.dataset.loc!);
        const toLocation = Number.parseInt(e.to.dataset.loc!);
        if (toLocation === undefined || fromLocation === toLocation) return;
        const players = [];
        for (const player of gameStore.players) {
            if (player.location === fromLocation && player.role !== 1) {
                player.location = toLocation;
                players.push(player.name);
            }
        }
        const idx = this.expanded.findIndex(x => x === fromLocation);
        if (idx >= 0) {
            this.expanded.slice(idx, 1);
            this.expanded.push(toLocation);
        }
        // e.item.remove();
        // e.clone.remove();
        socket.emit("Location.Change", { location: toLocation, users: players });
    }

    endPlayerDrag(e: { item: HTMLDivElement; from: HTMLDivElement; to: HTMLDivElement }): void {
        e.item.style.removeProperty("transform");
        const fromLocation = Number.parseInt(e.from.dataset.loc!);
        const toLocation = Number.parseInt(e.to.dataset.loc!);
        if (toLocation === undefined || fromLocation === toLocation) return;
        const targetPlayer = e.item.textContent!.trim();
        for (const player of gameStore.players) {
            if (player.name === targetPlayer) {
                player.location = toLocation;
                socket.emit("Location.Change", { location: toLocation, users: [targetPlayer] });
                break;
            }
        }
    }

    onDragAdd(e: { item: HTMLDivElement; clone: HTMLDivElement }): void {
        e.clone.replaceWith(e.item);
    }

    doHorizontalScroll(e: WheelEvent): void {
        const el: HTMLElement = (<any>this.$refs.locations).$el;
        if (e.deltaY > 0) el.scrollLeft += 100;
        else el.scrollLeft -= 100;
        this.horizontalOffset = el.scrollLeft;
        this.fixDisplays(el);
    }

    doHorizontalScrollA(_e: WheelEvent): void {
        const el: HTMLElement = (<any>this.$refs.locations).$el;
        this.fixDisplays(el);
    }

    private fixDisplays(el: HTMLElement): void {
        for (const expandEl of el.querySelectorAll(".player-collapse-content")) {
            const hEl = <HTMLElement>expandEl;
            hEl.style.marginLeft = `-${el.scrollLeft}px`;
            if (this.expanded.includes(Number.parseInt(hEl.dataset.loc || "-1"))) {
                if (hEl.style.display === "none") hEl.style.removeProperty("display");
            } else {
                continue;
            }
            if (hEl.getBoundingClientRect().right > window.innerWidth) {
                hEl.style.display = "none";
            }
        }
    }
}
</script>

<template>
    <div id="location-bar" v-if="IS_DM">
        <div id="create-location" :title="$t('game.ui.menu.locations.add_new_location')" @click="createLocation">+</div>
        <draggable
            id="locations"
            v-model="locations"
            @end="endLocationDrag"
            handle=".drag-handle"
            @wheel.native="doHorizontalScroll"
            @scroll.native="doHorizontalScrollA"
            ref="locations"
        >
            <div class="location" v-for="location in locations" :key="location.id">
                <div class="location-name" :class="{ 'active-location': activeLocation === location.id }">
                    <div class="drag-handle"></div>
                    <div class="location-name-label" @click.self="changeLocation(location.id)">{{ location.name }}</div>
                    <div class="location-settings-icon" @click="openLocationSettings(location.id)">
                        <i aria-hidden="true" class="fas fa-cog"></i>
                    </div>
                </div>
                <draggable
                    class="location-players"
                    v-show="playerLocations.has(location.id)"
                    :group="{ name: 'players', pull: 'clone' }"
                    @end="endPlayersDrag"
                    @add="onDragAdd"
                    handle=".player-collapse-header"
                    :data-loc="location.id"
                >
                    <div class="player-collapse-header">
                        {{ $t("common.players") }}
                        <div
                            :title="$t('game.ui.menu.locations.show_specific_pl')"
                            @click="toggleExpanded(location.id)"
                        >
                            <span v-show="expanded.includes(location.id)">
                                <i aria-hidden="true" class="fas fa-chevron-up"></i>
                            </span>
                            <span v-show="!expanded.includes(location.id)">
                                <i aria-hidden="true" class="fas fa-chevron-down"></i>
                            </span>
                        </div>
                    </div>
                    <draggable
                        class="player-collapse-content"
                        v-show="expanded.includes(location.id)"
                        :data-loc="location.id"
                        group="player"
                        @end="endPlayerDrag"
                    >
                        <div
                            class="player-collapse-item"
                            v-for="player in playerLocations.get(location.id)"
                            :key="player"
                            :data-loc="location.id"
                        >
                            {{ player }}
                        </div>
                    </draggable>
                    <draggable
                        class="location-players-empty"
                        v-show="!expanded.includes(location.id)"
                        group="player"
                        :data-loc="location.id"
                    ></draggable>
                </draggable>
                <draggable
                    class="location-players-empty"
                    v-show="!playerLocations.has(location.id)"
                    @add="onDragAdd"
                    :group="{ name: 'empty-players', put: ['players', 'player'] }"
                    :data-loc="location.id"
                ></draggable>
            </div>
        </draggable>
    </div>
</template>

<style scoped>
#location-bar {
    --primary: #7c253e;
    --secondary: #9c455e;
    --primaryBG: #7c253e50;
    display: flex;
    grid-area: locations;
    border-bottom: solid 1px var(--secondary);
    background-color: var(--primaryBG);
    pointer-events: auto;
}

#locations {
    pointer-events: auto;
    display: grid;
    grid-auto-flow: column;
    grid-gap: 10px;
    overflow-y: hidden;
    max-width: calc(100vw - 105px); /* 105 = width of the #create-location div */

    scrollbar-width: thin;
    scrollbar-color: var(--secondary) var(--primary);
}

#locations::-webkit-scrollbar {
    height: 11px;
}
#locations::-webkit-scrollbar-track {
    background: var(--secondary);
    border-radius: 6px;
}
#locations::-webkit-scrollbar-thumb {
    background-color: var(--primary);
    border-radius: 6px;
}

#create-location {
    overflow: hidden;
    flex-shrink: 0;
    display: inline-grid;
    width: 85px;
    color: white;
    background-color: var(--secondary);
    font-size: 30px;
    place-items: center center;
    margin: 10px;
}

#create-location:hover {
    font-weight: bold;
    cursor: pointer;
    text-shadow: 0 0 20px rgba(0, 0, 0, 1);
}

.location {
    display: flex;
    margin-top: 10px;
    flex-direction: column;
    user-select: none;
}

.location-name {
    padding: 1em;
    color: #fca5be;
    background-color: var(--primary);
    display: flex;
    position: relative;
    align-items: center;
}

.location-name-label {
    flex-grow: 2;
}

.location-settings-icon {
    padding-left: 10px;
}

.location-settings-icon svg {
    transition: transform 0.8s ease-in-out;
}

.location-settings-icon:hover svg {
    transform: rotate(180deg);
    transform-origin: center center;
}

.drag-handle {
    width: 25px;
    height: 20px;
}

.drag-handle::before {
    position: absolute;
    top: 8px;
    content: ".";
    color: white;
    font-size: 20px;
    line-height: 20px;
    text-shadow: 0 5px white, 0 10px white, 5px 0 white, 5px 5px white, 5px 10px white, 10px 0 white, 10px 5px white,
        10px 10px white;
}

.drag-handle:hover,
.drag-handle *:hover {
    cursor: grab;
}

.location-players {
    margin-bottom: 0.5em;
    margin-left: 0.5em;
    margin-right: 0.5em;
    color: white;
    border-top: 0;
    display: flex;
    flex-direction: column;
    min-width: 150px;
}

.player-collapse-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5em 1em;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    background-color: var(--secondary);
}

.player-collapse-content {
    position: absolute;
    /* top: 15px; */
    margin-top: 35px;
}

.player-collapse-item {
    margin-top: 10px;
    padding: 0.5em 1em;
    border-radius: 5px;
    background-color: var(--secondary);
}

.active-location {
    color: white;
    background-color: var(--primary);
}

.location:hover .location-name {
    cursor: pointer;
    color: white;
    background-color: var(--primary);
}
</style>
