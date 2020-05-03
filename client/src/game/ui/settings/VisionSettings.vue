<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

import { gameStore } from "@/game/store";
import { VisibilityMode, visibilityStore } from "@/game/visibility/store";
import { layerManager } from "@/game/layers/manager";
import { gameSettingsStore } from "../../settings";

@Component
export default class VisionSettings extends Vue {
    @Prop() location!: string | null;

    get fakePlayer(): boolean {
        return gameStore.FAKE_PLAYER;
    }
    set fakePlayer(value: boolean) {
        gameStore.setFakePlayer(value);
    }
    get fullFow(): boolean {
        return gameSettingsStore.fullFow;
    }
    set fullFow(fullFow: boolean) {
        gameSettingsStore.setFullFow({ fullFow, location: this.location, sync: true });
    }
    get fowOpacity(): number {
        return gameSettingsStore.fowOpacity;
    }
    set fowOpacity(fowOpacity: number) {
        if (typeof fowOpacity !== "number") return;
        gameSettingsStore.setFowOpacity({ fowOpacity, location: this.location, sync: true });
    }
    get fowLos(): boolean {
        return gameSettingsStore.fowLos;
    }
    set fowLos(fowLos: boolean) {
        gameSettingsStore.setLineOfSight({ fowLos, location: this.location, sync: true });
    }
    get unitSizeUnit(): string {
        return gameSettingsStore.unitSizeUnit;
    }
    get visionMinRange(): number {
        return gameSettingsStore.visionMinRange;
    }
    set visionMinRange(visionMinRange: number) {
        if (typeof visionMinRange !== "number") return;
        gameSettingsStore.setVisionRangeMin({ visionMinRange, location: this.location, sync: true });
    }
    get visionMaxRange(): number {
        return gameSettingsStore.visionMaxRange;
    }
    set visionMaxRange(visionMaxRange: number) {
        if (typeof visionMaxRange !== "number") return;
        gameSettingsStore.setVisionRangeMax({ visionMaxRange, location: this.location, sync: true });
    }
    changeVisionMode(event: { target: HTMLSelectElement }): void {
        const value = event.target.value.toLowerCase();
        let mode: VisibilityMode;
        if (value === "default") mode = VisibilityMode.TRIANGLE;
        else if (value === "experimental") mode = VisibilityMode.TRIANGLE_ITERATIVE;
        else return;
        visibilityStore.setVisionMode({ mode, location: this.location, sync: true });
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
        <div class="spanrow">
            <i style="max-width: 40vw">
                <template v-if="location === null">
                    Some of these settings can be overriden by location specific settings
                </template>
                <template v-else>Settings that override the campaign defaults are highlighted</template>
            </i>
        </div>
        <div class="spanrow header">Core</div>
        <div class="row">
            <label :for="'fakePlayerInput-' + location">Fake player:</label>
            <div>
                <input :id="'fakePlayerInput-' + location" type="checkbox" v-model="fakePlayer" />
            </div>
        </div>
        <div class="row">
            <label :for="'useFOWInput-' + location">Fill entire canvas with FOW:</label>
            <div>
                <input :id="'useFOWInput-' + location" type="checkbox" v-model="fullFow" />
            </div>
        </div>
        <div class="row">
            <label :for="'fowLos-' + location">Only show lights in LoS:</label>
            <div>
                <input :id="'fowLos-' + location" type="checkbox" v-model="fowLos" />
            </div>
        </div>
        <div class="row">
            <label :for="'fowOpacity-' + location">FOW opacity:</label>
            <div>
                <input
                    :id="'fowOpacity-' + location"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    v-model.number="fowOpacity"
                />
            </div>
        </div>
        <div class="spanrow header">Advanced</div>
        <div class="row">
            <label :for="'visionMode-' + location">Vision Mode:</label>
            <div>
                <select :id="'visionMode-' + location" @change="changeVisionMode">
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
            <label :for="'vmininp-' + location">Minimal full vision ({{ unitSizeUnit }}):</label>
            <div>
                <input :id="'vmininp-' + location" type="number" min="0" v-model.lazy.number="visionMinRange" />
            </div>
        </div>
        <div class="row">
            <label :for="'vmaxinp-' + location">Maximal vision ({{ unitSizeUnit }}):</label>
            <div>
                <input :id="'vmaxinp-' + location" type="number" min="0" v-model.lazy.number="visionMaxRange" />
            </div>
        </div>
    </div>
</template>
