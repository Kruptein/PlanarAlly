<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import draggable from "vuedraggable";
import { mapState } from "vuex";

import Prompt from "@/core/components/modals/prompt.vue";
import SelectionBox from "@/core/components/modals/SelectionBox.vue";
import { sendLocationChange, sendNewLocation } from "@/game/api/emits/location";
import { gameStore } from "@/game/store";

import { coreStore } from "../../../core/store";
import { EventBus } from "../../event-bus";
import { Location } from "../../models/settings";

@Component({
    computed: {
        ...mapState("game", ["IS_DM"]),
        ...mapState("gameSettings", ["activeLocation"]),
    },
    components: { Prompt, SelectionBox },
})
export default class LocationBar extends Vue {
    activeLocation!: number;
    IS_DM!: boolean;

    $refs!: {
        // archived: ArchivedLocations;
        locations: InstanceType<typeof draggable>;
        prompt: Prompt;
        selectionbox: SelectionBox;
    };

    @Prop() active!: boolean;
    @Prop() menuActive!: boolean;

    @Watch("active")
    toggleActive(active: boolean): void {
        for (const expandEl of this.$refs.locations.$el.querySelectorAll(".player-collapse-content")) {
            const hEl = expandEl as HTMLElement;
            if (this.expanded.includes(Number.parseInt(hEl.dataset.loc || "-1"))) {
                if (active) {
                    hEl.style.removeProperty("display");
                } else {
                    hEl.style.display = "none";
                }
            }
        }
    }

    expanded: number[] = [];
    horizontalOffset = 0;

    changeLocation(id: number): void {
        sendLocationChange({ location: id, users: [gameStore.username] });
        coreStore.setLoading(true);
    }

    get locations(): Location[] {
        return [...gameStore.activeLocations];
    }

    set locations(locations: Location[]) {
        gameStore.setActiveLocations({ locations, sync: true });
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
        const value = await this.$refs.prompt.prompt(
            this.$t("game.ui.menu.locations.new_location_name").toString(),
            this.$t("game.ui.menu.locations.create_new_location").toString(),
        );
        if (value !== undefined) sendNewLocation(value);
    }

    openLocationSettings(location: number): void {
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
        const idx = this.expanded.findIndex((x) => x === fromLocation);
        if (idx >= 0) {
            this.expanded.slice(idx, 1);
            this.expanded.push(toLocation);
        }
        sendLocationChange({ location: toLocation, users: players });
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
                sendLocationChange({ location: toLocation, users: [targetPlayer] });
                break;
            }
        }
    }

    onDragAdd(e: { item: HTMLDivElement; clone: HTMLDivElement }): void {
        e.clone.replaceWith(e.item);
    }

    doHorizontalScroll(e: WheelEvent): void {
        const el: HTMLElement = this.$refs.locations.$el as HTMLElement;
        if (e.deltaY > 0) el.scrollLeft += 100;
        else el.scrollLeft -= 100;
        this.horizontalOffset = el.scrollLeft;
        this.fixDisplays(el);
    }

    doHorizontalScrollA(_e: WheelEvent): void {
        const el: HTMLElement = this.$refs.locations.$el as HTMLElement;
        this.fixDisplays(el);
    }

    private fixDisplays(el: HTMLElement): void {
        for (const expandEl of el.querySelectorAll(".player-collapse-content")) {
            const hEl = expandEl as HTMLElement;
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

    getLocationPlayers(location: number): string[] {
        return this.playerLocations.get(location) ?? [];
    }

    hasArchivedLocations(): boolean {
        return gameStore.archivedLocations.length > 0;
    }

    async showArchivedLocations(): Promise<void> {
        const locations = gameStore.archivedLocations;
        if (locations.length === 0) return;
        const choice = await this.$refs.selectionbox.open(
            "Select a location to restore",
            locations.map((l) => l.name),
        );
        const location = locations.find((l) => l.name === choice);
        if (choice !== undefined && location !== undefined) {
            gameStore.unarchiveLocation({ id: location.id, sync: true });
        }
    }
}
</script>

<template>
    <div id="location-bar" v-if="IS_DM">
        <!-- <ArchivedLocations ref="archived" /> -->
        <SelectionBox ref="selectionbox" />
        <Prompt ref="prompt" />
        <div id="location-actions">
            <div id="create-location" :title="$t('game.ui.menu.locations.add_new_location')" @click="createLocation">
                +
            </div>
            <div
                id="archive-locations"
                title="Show archived locations"
                @click="showArchivedLocations"
                :class="{ noArchived: !hasArchivedLocations() }"
            >
                <font-awesome-icon icon="archive" />
            </div>
        </div>
        <draggable
            id="locations"
            v-model="locations"
            @end="endLocationDrag"
            handle=".drag-handle"
            @wheel.native="doHorizontalScroll"
            @scroll.native="doHorizontalScrollA"
            ref="locations"
            :style="{ maxWidth: 'calc(100vw - 105px - ' + (menuActive ? '200px' : '0px') + ')' }"
        >
            <div class="location" v-for="location in locations" :key="location.id">
                <div class="location-name" :class="{ 'active-location': activeLocation === location.id }">
                    <div class="drag-handle"></div>
                    <div class="location-name-label" @click.self="changeLocation(location.id)">{{ location.name }}</div>
                    <div class="location-settings-icon" @click="openLocationSettings(location.id)">
                        <font-awesome-icon icon="cog" />
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
                                <font-awesome-icon icon="chevron-up" />
                            </span>
                            <span v-show="!expanded.includes(location.id)">
                                <font-awesome-icon icon="chevron-down" />
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
                            v-for="player in getLocationPlayers(location.id)"
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

<style scoped lang="scss">
#location-bar {
    --primary: #7c253e;
    --secondary: 156, 69, 94;
    --primaryBG: #7c253e50;
    display: flex;
    grid-area: locations;
    border-bottom: solid 1px rgb(var(--secondary));
    background-color: var(--primaryBG);
    pointer-events: auto;
}

#location-actions {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;

    #create-location,
    #archive-locations {
        box-sizing: border-box;
        display: inline-grid;
        width: 85px;
        color: white;
        border: solid 2px transparent;
        background-color: rgb(var(--secondary));
        font-size: 30px;
        place-items: center center;
        margin: 10px;
        padding: 10px 0;

        &:hover {
            font-weight: bold;
            cursor: pointer;
            text-shadow: 0 0 20px rgba(0, 0, 0, 1);
            border-color: white;
        }

        &.noArchived {
            background-color: rgba(var(--secondary), 0.4);

            &:hover,
            &:hover * {
                cursor: not-allowed;
                border-color: transparent;
            }
        }
    }
}

#locations {
    pointer-events: auto;
    display: grid;
    grid-auto-flow: column;
    grid-gap: 10px;
    overflow-y: hidden;
    max-width: calc(100vw - 105px); /* 105 = width of the #create-location div */

    scrollbar-width: thin;
    scrollbar-color: rgb(var(--secondary)) var(--primary);

    &::-webkit-scrollbar {
        height: 11px;
    }

    &::-webkit-scrollbar-track {
        background: rgb(var(--secondary));
        border-radius: 6px;
    }

    &::-webkit-scrollbar-thumb {
        background-color: var(--primary);
        border-radius: 6px;
    }
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

    svg {
        transition: transform 0.8s ease-in-out;
    }

    &:hover svg {
        transform: rotate(180deg);
        transform-origin: center center;
    }
}

.drag-handle {
    width: 25px;
    height: 20px;

    &::before {
        position: absolute;
        top: 8px;
        content: ".";
        color: white;
        font-size: 20px;
        line-height: 20px;
        text-shadow: 0 5px white, 0 10px white, 5px 0 white, 5px 5px white, 5px 10px white, 10px 0 white, 10px 5px white,
            10px 10px white;
    }

    &:hover,
    *:hover {
        cursor: grab;
    }
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
    background-color: rgb(var(--secondary));
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
    background-color: rgb(var(--secondary));
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
