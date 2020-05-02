<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { gameStore } from "@/game/store";

@Component
export default class VisionSettings extends Vue {
    get useGrid(): boolean {
        return gameStore.useGrid;
    }
    set useGrid(value: boolean) {
        gameStore.setUseGrid({ useGrid: value, sync: true });
    }
    get unitSize(): number {
        return gameStore.unitSize;
    }
    set unitSize(value: number) {
        if (typeof value !== "number") return;
        gameStore.setUnitSize({ unitSize: value, sync: true });
    }
    get unitSizeUnit(): string {
        return gameStore.unitSizeUnit;
    }
    set unitSizeUnit(value: string) {
        gameStore.setUnitSizeUnit({ unitSizeUnit: value, sync: true });
    }
    get gridSize(): number {
        return gameStore.gridSize;
    }
    set gridSize(value: number) {
        if (typeof value !== "number") return;
        gameStore.setGridSize({ gridSize: value, sync: true });
    }
}
</script>

<template>
    <div class="panel">
        <div class="spanrow header">Core</div>
        <div class="row">
            <label for="fakePlayerInput">Fake player:</label>
            <div>
                <input id="fakePlayerInput" type="checkbox" v-model="fakePlayer" />
            </div>
        </div>
        <div class="row">
            <label for="useFOWInput">Fill entire canvas with FOW:</label>
            <div>
                <input id="useFOWInput" type="checkbox" v-model="fullFOW" />
            </div>
        </div>
        <div class="row">
            <label for="fowLOS">Only show lights in LoS:</label>
            <div>
                <input id="fowLOS" type="checkbox" v-model="fowLOS" />
            </div>
        </div>
        <div class="row">
            <label for="fowOpacity">FOW opacity:</label>
            <div>
                <input id="fowOpacity" type="number" min="0" max="1" step="0.1" v-model.number="fowOpacity" />
            </div>
        </div>
        <div class="spanrow header">Advanced</div>
        <div class="row">
            <label for="visionMode">Vision Mode:</label>
            <div>
                <select id="visionMode" @change="changeVisionMode">
                    <option :selected="$store.state.visibility.visionMode === 0">
                        Default
                    </option>
                    <option :selected="$store.state.visibility.visionMode === 1">
                        Experimental
                    </option>
                </select>
            </div>
        </div>
        <div class="row">
            <label for="vmininp">Minimal full vision ({{ unitSizeUnit }}):</label>
            <div>
                <input id="vmininp" type="number" min="0" v-model.lazy.number="visionRangeMin" />
            </div>
        </div>
        <div class="row">
            <label for="vmaxinp">Maximal vision ({{ unitSizeUnit }}):</label>
            <div>
                <input id="vmaxinp" type="number" min="0" v-model.lazy.number="visionRangeMax" />
            </div>
        </div>
    </div>
</template>