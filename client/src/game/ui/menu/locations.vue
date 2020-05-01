<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { mapState } from "vuex";
import { Prop } from "vue-property-decorator";

import Game from "@/game/game.vue";

import { gameStore } from "@/game/store";
import { socket } from "@/game/api/socket";

@Component({
    computed: {
        ...mapState("game", ["IS_DM"]),
    },
})
export default class LocationBar extends Vue {
    @Prop() active!: boolean;

    expanded: string[] = [];
    horizontalOffset = 0;

    getCurrentLocation(): string {
        return gameStore.locationName;
    }

    changeLocation(name: string): void {
        socket.emit("Location.Change", name);
    }

    get locations(): string[] {
        return gameStore.locations;
    }

    set locations(locations: string[]) {
        gameStore.setLocations({ locations, sync: true });
    }

    get playerLocations(): Map<string, string[]> {
        const map: Map<string, string[]> = new Map();
        for (const player of gameStore.players) {
            if (!map.has(player.location)) map.set(player.location, []);
            map.get(player.location)!.push(player.name);
        }
        return map;
    }

    async createLocation(): Promise<void> {
        const value = await (<Game>this.$parent.$parent).$refs.prompt.prompt(
            `New location name:`,
            `Create new location`,
        );
        socket.emit("Location.New", value);
    }

    toggleExpanded(name: string): void {
        const idx = this.expanded.indexOf(name);
        if (idx < 0) this.expanded.push(name);
        else this.expanded.splice(idx, 1);
    }

    endDrag(e: any): void {
        e.item.style.transform = null;
        console.log(gameStore.locations);
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
            if (this.expanded.includes(hEl.dataset.loc || "")) {
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
    <div id="location-bar">
        <div id="create-location" title="Add new location" @click="createLocation">+</div>
        <draggable
            id="locations"
            v-if="IS_DM"
            v-model="locations"
            :style="{ active: active }"
            @end="endDrag"
            handle=".drag-handle"
            @wheel.native="doHorizontalScroll"
            @scroll.native="doHorizontalScrollA"
            ref="locations"
        >
            <div class="location" v-for="location in locations" :key="location">
                <div
                    class="location-name"
                    @click="changeLocation(location)"
                    :class="{ 'active-location': getCurrentLocation() === location }"
                >
                    <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
                    {{ location }}
                </div>
                <div class="location-players" v-show="playerLocations.has(location)">
                    <div class="player-collapse-header">
                        Players
                        <div title="Show specific players" @click="toggleExpanded(location)">
                            <span v-show="expanded.includes(location)"><i class="fas fa-chevron-up"></i></span>
                            <span v-show="!expanded.includes(location)"><i class="fas fa-chevron-down"></i></span>
                        </div>
                    </div>
                    <div class="player-collapse-content" v-show="expanded.includes(location)" :data-loc="location">
                        <div class="player-collapse-item" v-for="player in playerLocations.get(location)" :key="player">
                            {{ player }}
                        </div>
                    </div>
                </div>
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
}

#locations {
    pointer-events: auto;
    display: grid;
    grid-auto-flow: column;
    /* grid-auto-columns: 300px; */
    grid-gap: 10px;
    overflow-y: hidden;
    overflow-x: auto;

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
    flex-shrink: 0;
    display: grid;
    width: 85px;
    height: 85px;
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
    background-color: var(--primary);
    display: flex;
}

.drag-handle {
    margin-right: 10px;
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
