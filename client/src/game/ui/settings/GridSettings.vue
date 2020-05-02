<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { gameStore } from "@/game/store";
import { VisibilityMode, visibilityStore } from "@/game/visibility/store";
import { layerManager } from "@/game/layers/manager";

@Component
export default class GridSettings extends Vue {
    get fakePlayer(): boolean {
        return gameStore.FAKE_PLAYER;
    }
    set fakePlayer(value: boolean) {
        gameStore.setFakePlayer(value);
    }
    get fullFOW(): boolean {
        return gameStore.fullFOW;
    }
    set fullFOW(value: boolean) {
        gameStore.setFullFOW({ fullFOW: value, sync: true });
    }
    get fowOpacity(): number {
        return gameStore.fowOpacity;
    }
    set fowOpacity(value: number) {
        if (typeof value !== "number") return;
        gameStore.setFOWOpacity({ fowOpacity: value, sync: true });
    }
    get fowLOS(): boolean {
        return gameStore.fowLOS;
    }
    set fowLOS(value: boolean) {
        gameStore.setLineOfSight({ fowLOS: value, sync: true });
    }
    get visionRangeMin(): number {
        return gameStore.visionRangeMin;
    }
    set visionRangeMin(value: number) {
        if (typeof value !== "number") return;
        gameStore.setVisionRangeMin({ value, sync: true });
    }
    get visionRangeMax(): number {
        return gameStore.visionRangeMax;
    }
    set visionRangeMax(value: number) {
        if (typeof value !== "number") return;
        gameStore.setVisionRangeMax({ value, sync: true });
    }
    changeVisionMode(event: { target: HTMLSelectElement }): void {
        const value = event.target.value.toLowerCase();
        let mode: VisibilityMode;
        if (value === "default") mode = VisibilityMode.TRIANGLE;
        else if (value === "experimental") mode = VisibilityMode.TRIANGLE_ITERATIVE;
        else return;
        visibilityStore.setVisionMode({ mode, sync: true });
        for (const floor of layerManager.floors) {
            visibilityStore.recalculateVision(floor.name);
            visibilityStore.recalculateMovement(floor.name);
        }
        layerManager.invalidateAllFloors();
    }
}
</script>

<template>
    <div class="panel">
        <div class="row">
            <label for="useGridInput">Use grid</label>
            <div>
                <input id="useGridInput" type="checkbox" v-model="useGrid" />
            </div>
        </div>
        <div class="row">
            <label for="gridSizeInput">Grid Size (in pixels):</label>
            <div>
                <input id="gridSizeInput" type="number" min="0" v-model.number="gridSize" />
            </div>
        </div>
        <div class="row">
            <div>
                <label for="unitSizeUnit">Size Unit</label>
            </div>
            <div>
                <input id="unitSizeUnit" type="text" v-model="unitSizeUnit" />
            </div>
        </div>
        <div class="row">
            <div>
                <label for="unitSizeInput">Unit Size (in {{ unitSizeUnit }})</label>
            </div>
            <div>
                <input id="unitSizeInput" type="number" v-model.number="unitSize" />
            </div>
        </div>
    </div>
</template>