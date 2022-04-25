<script setup lang="ts">
import { computed, ref, toRef, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";

import { useModal } from "../../../core/plugins/modals/plugin";
import { clientStore } from "../../../store/client";
import { coreStore } from "../../../store/core";
import { gameStore } from "../../../store/game";
import { locationStore } from "../../../store/location";
import { settingsStore } from "../../../store/settings";
import { uiStore } from "../../../store/ui";
import { sendLocationChange, sendNewLocation } from "../../api/emits/location";
import type { Location } from "../../models/settings";

const props = defineProps<{ active: boolean; menuActive: boolean }>();

const { t } = useI18n();
const modals = useModal();

const locations = ref<{ $el: HTMLDivElement } | null>(null);

const isDm = toRef(gameStore.state, "isDm");

const activeLocations = computed({
    get() {
        return locationStore.activeLocations.value;
    },
    set(locations: Location[]) {
        locationStore.setActiveLocations(locations, true);
    },
});

// could not figure out how to use the @scroll events on the draggable in vue3
// used to work fine in vue2, played around with component-data but to no avail
watchEffect(() => {
    if (locations.value) {
        locations.value.$el.addEventListener("scroll", () => fixDisplays());
        locations.value.$el.addEventListener("wheel", (e) => horizontalWheel(e));
    }
});

// :style with `menuActive` did not update properly on the draggable
watchEffect(() => {
    if (locations.value !== null) {
        locations.value.$el.style.maxWidth = `calc(100vw - 105px - ${props.menuActive ? "200px" : "0px"})`;
    }
});

const expanded = ref<Set<number>>(new Set());

const hasArchivedLocations = computed(() => locationStore.archivedLocations.value.length > 0);

async function showArchivedLocations(): Promise<void> {
    const locations = locationStore.archivedLocations.value;
    if (locations.length === 0) return;

    const choice = await modals.selectionBox(
        "Select a location to retore",
        locations.map((l) => l.name),
    );
    const location = locations.find((l) => l.name === choice?.[0]);
    if (choice !== undefined && location !== undefined) {
        locationStore.unarchiveLocation(location.id, true);
    }
}

async function createLocation(): Promise<void> {
    const value = await modals.prompt(
        t("game.ui.menu.LocationBar.new_location_name"),
        t("game.ui.menu.LocationBar.create_new_location"),
    );
    if (value !== undefined) sendNewLocation(value);
}

function changeLocation(id: number): void {
    sendLocationChange({ location: id, users: [clientStore.state.username] });
    coreStore.setLoading(true);
}

function openLocationSettings(location: number): void {
    uiStore.showLocationSettings(location);
}

function toggleExpanded(id: number): void {
    if (expanded.value.has(id)) expanded.value.delete(id);
    else expanded.value.add(id);
}

function onDragAdd(event: { item: HTMLDivElement; clone: HTMLDivElement }): void {
    event.clone.replaceWith(event.item);
}

function endPlayerDrag(e: { item: HTMLDivElement; from: HTMLDivElement; to: HTMLDivElement }): void {
    e.item.style.removeProperty("transform");
    const fromLocation = Number.parseInt(e.from.dataset.loc!);
    const toLocation = Number.parseInt(e.to.dataset.loc!);
    if (toLocation === undefined || fromLocation === toLocation) return;
    const targetPlayer = e.item.textContent!.trim();

    for (const player of gameStore.state.players) {
        if (player.name === targetPlayer) {
            gameStore.updatePlayersLocation([player.name], toLocation, true);
            break;
        }
    }
}

function endPlayersDrag(e: { item: HTMLDivElement; from: HTMLDivElement; to: HTMLDivElement }): void {
    e.item.style.removeProperty("transform");
    const fromLocation = Number.parseInt(e.from.dataset.loc!);
    const toLocation = Number.parseInt(e.to.dataset.loc!);
    if (toLocation === undefined || fromLocation === toLocation) return;

    const players = [];
    for (const player of gameStore.state.players) {
        if (player.location === fromLocation && player.role !== 1) {
            players.push(player.name);
        }
    }
    gameStore.updatePlayersLocation(players, toLocation, true);

    if (expanded.value.has(fromLocation)) {
        expanded.value.delete(fromLocation);
        expanded.value.add(toLocation);
    }
}

function horizontalWheel(event: WheelEvent): void {
    if (locations.value === null) return;

    const el = locations.value.$el;

    if (event.deltaY > 0) el.scrollLeft += 100;
    else el.scrollLeft -= 100;
    fixDisplays();
}

function fixDisplays(): void {
    if (locations.value === null) return;

    const el = locations.value.$el;

    for (const expandEl of el.querySelectorAll(".player-collapse-content")) {
        const hEl = expandEl as HTMLElement;
        hEl.style.marginLeft = `calc(0.5em - ${el.scrollLeft}px)`;
        if (expanded.value.has(Number.parseInt(hEl.dataset.loc ?? "-1"))) {
            if (hEl.style.display === "none") hEl.style.removeProperty("display");
        } else {
            continue;
        }
        if (hEl.getBoundingClientRect().right > window.innerWidth) {
            hEl.style.display = "none";
        }
    }
}

const activeLocation = toRef(settingsStore.state, "activeLocation");
</script>

<template>
    <div id="location-bar" v-if="isDm">
        <div id="location-actions">
            <div id="create-location" :title="t('game.ui.menu.LocationBar.add_new_location')" @click="createLocation">
                +
            </div>
            <div
                id="archive-locations"
                title="Show archived locations"
                @click="showArchivedLocations"
                :class="{ noArchived: !hasArchivedLocations }"
            >
                <font-awesome-icon icon="archive" />
            </div>
        </div>
        <draggable id="locations" v-model="activeLocations" item-key="id" ref="locations" handle=".drag-handle">
            <template #item="{ element: location }">
                <div class="location">
                    <div class="location-name" :class="{ 'active-location': activeLocation === location.id }">
                        <div class="drag-handle"></div>
                        <div class="location-name-label" @click.self="changeLocation(location.id)">
                            {{ location.name }}
                        </div>
                        <div class="location-settings-icon" @click="openLocationSettings(location.id)">
                            <font-awesome-icon icon="cog" />
                        </div>
                    </div>
                    <draggable
                        class="location-players"
                        v-show="locationStore.state.playerLocations.has(location.id)"
                        :list="[{ id: location.id }]"
                        item-key="id"
                        :group="{ name: 'players', pull: 'clone' }"
                        handle=".player-collapse-header"
                        :data-loc="location.id"
                        @add="onDragAdd"
                        @end="endPlayersDrag"
                    >
                        <template #item>
                            <div class="player-collapse-header">
                                {{ t("common.players") }}
                                <div
                                    :title="t('game.ui.menu.LocationBar.show_specific_pl')"
                                    @click="toggleExpanded(location.id)"
                                >
                                    <span v-show="expanded.has(location.id)">
                                        <font-awesome-icon icon="chevron-up" />
                                    </span>
                                    <span v-show="!expanded.has(location.id)">
                                        <font-awesome-icon icon="chevron-down" />
                                    </span>
                                </div>
                            </div>
                        </template>
                    </draggable>
                    <draggable
                        class="player-collapse-content"
                        v-show="active && expanded.has(location.id)"
                        :list="[...(locationStore.state.playerLocations.get(location.id) ?? [])]"
                        item-key="id"
                        :data-loc="location.id"
                        group="player"
                        @end="endPlayerDrag"
                    >
                        <template #item="{ element: player }">
                            <div class="player-collapse-item" :data-loc="location.id">
                                {{ player }}
                            </div>
                        </template>
                    </draggable>
                    <draggable
                        class="location-players-empty"
                        v-show="!locationStore.state.playerLocations.has(location.id)"
                        :group="{ name: 'empty-players', put: ['players', 'player'] }"
                        :list="[{ id: location.id }]"
                        item-key="id"
                        :data-loc="location.id"
                        @add="onDragAdd"
                    >
                        <template #item><div></div></template>
                    </draggable>
                </div>
            </template>
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

.location-players-empty {
    height: 25px;
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
    margin-top: 90px;
    margin-left: 0.5em;
    color: white;
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
