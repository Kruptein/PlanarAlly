<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

import { gameStore } from "@/game/store";
import { VisibilityMode, visibilityStore } from "@/game/visibility/store";
import { layerManager } from "@/game/layers/manager";
import { gameSettingsStore, getLocationOption } from "../../settings";
import { LocationOptions } from "@/game/comm/types/settings";

@Component
export default class VisionSettings extends Vue {
    @Prop() location!: number | null;

    get defaults(): LocationOptions {
        return gameSettingsStore.defaultLocationOptions!;
    }

    get options(): Partial<LocationOptions> {
        if (this.location === null) return this.defaults;
        return gameSettingsStore.locationOptions[this.location] ?? {};
    }

    get fakePlayer(): boolean {
        return gameStore.FAKE_PLAYER;
    }
    set fakePlayer(value: boolean) {
        gameStore.setFakePlayer(value);
    }
    get fullFow(): boolean {
        return getLocationOption("fullFow", this.location)!;
    }
    set fullFow(fullFow: boolean) {
        gameSettingsStore.setFullFow({ fullFow, location: this.location, sync: true });
    }
    get fowOpacity(): number {
        return getLocationOption("fowOpacity", this.location)!;
    }
    set fowOpacity(fowOpacity: number) {
        if (typeof fowOpacity !== "number") return;
        gameSettingsStore.setFowOpacity({ fowOpacity, location: this.location, sync: true });
    }
    get fowLos(): boolean {
        return getLocationOption("fowLos", this.location)!;
    }
    set fowLos(fowLos: boolean) {
        gameSettingsStore.setLineOfSight({ fowLos, location: this.location, sync: true });
    }
    get unitSizeUnit(): string {
        return getLocationOption("unitSizeUnit", this.location)!;
    }
    get visionMinRange(): number {
        return getLocationOption("visionMinRange", this.location)!;
    }
    set visionMinRange(visionMinRange: number) {
        if (typeof visionMinRange !== "number") return;
        gameSettingsStore.setVisionRangeMin({ visionMinRange, location: this.location, sync: true });
    }
    get visionMaxRange(): number {
        return getLocationOption("visionMaxRange", this.location)!;
    }
    set visionMaxRange(visionMaxRange: number) {
        if (typeof visionMaxRange !== "number") return;
        gameSettingsStore.setVisionRangeMax({ visionMaxRange, location: this.location, sync: true });
    }
    changeVisionMode(event: { target: HTMLSelectElement }): void {
        const value = event.target.value;
        let mode: VisibilityMode;
        if (value === this.$t("game.ui.settings.VisionSettings.default").toString()) mode = VisibilityMode.TRIANGLE;
        else if (value === this.$t("game.ui.settings.VisionSettings.experimental").toString())
            mode = VisibilityMode.TRIANGLE_ITERATIVE;
        else return;
        visibilityStore.setVisionMode({ mode, sync: true });
        for (const floor of layerManager.floors) {
            visibilityStore.recalculateVision(floor.name);
            visibilityStore.recalculateMovement(floor.name);
        }
        layerManager.invalidateAllFloors();
    }

    reset(key: keyof LocationOptions): void {
        if (this.location === null) return;
        gameSettingsStore.reset({ key, location: this.location });
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow">
            <template v-if="location === null">
                <em style="max-width: 40vw">
                    {{ $t("game.ui.settings.common.overridden_msg") }}
                </em>
            </template>
            <template v-else>
                <i18n path="game.ui.settings.common.overridden_highlight_path" tag="span">
                    <span class="overwritten">{{ $t("game.ui.settings.common.overridden_highlight") }}</span>
                </i18n>
            </template>
        </div>
        <div class="spanrow header" v-t="'game.ui.settings.VisionSettings.core'"></div>
        <div class="row" v-if="location === null">
            <label for="fakePlayerInput" v-t="'game.ui.settings.VisionSettings.fake_player'"></label>
            <div>
                <input id="fakePlayerInput" type="checkbox" v-model="fakePlayer" />
            </div>
            <div></div>
        </div>
        <div class="row" :class="{ overwritten: location !== null && options.fullFow !== undefined }">
            <label :for="'useFOWInput-' + location" v-t="'game.ui.settings.VisionSettings.fill_fow'"></label>
            <div>
                <input :id="'useFOWInput-' + location" type="checkbox" v-model="fullFow" />
            </div>
            <div
                v-if="location !== null && options.fullFow !== undefined"
                @click="reset('fullFow')"
                :title="$t('game.ui.settings.common.reset_default')"
            >
                <i aria-hidden="true" class="fas fa-times-circle"></i>
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: location !== null && options.fowLos !== undefined }">
            <label :for="'fowLos-' + location" v-t="'game.ui.settings.VisionSettings.only_show_lights_los'"></label>
            <div>
                <input :id="'fowLos-' + location" type="checkbox" v-model="fowLos" />
            </div>
            <div
                v-if="location !== null && options.fowLos !== undefined"
                @click="reset('fowLos')"
                :title="$t('game.ui.settings.common.reset_default')"
            >
                <i aria-hidden="true" class="fas fa-times-circle"></i>
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: location !== null && options.fowOpacity !== undefined }">
            <label :for="'fowOpacity-' + location" v-t="'game.ui.settings.VisionSettings.fow_opacity'"></label>
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
            <div
                v-if="location !== null && options.fowOpacity !== undefined"
                @click="reset('fowOpacity')"
                :title="$t('game.ui.settings.common.reset_default')"
            >
                <i aria-hidden="true" class="fas fa-times-circle"></i>
            </div>
            <div v-else></div>
        </div>
        <div class="spanrow header" v-t="'game.ui.settings.VisionSettings.advanced'"></div>
        <div class="row" v-if="location === null">
            <label :for="'visionMode-' + location" v-t="'game.ui.settings.VisionSettings.vision_mode'"></label>
            <div>
                <select :id="'visionMode-' + location" @change="changeVisionMode">
                    <option
                        :selected="$store.state.visibility.visionMode === 0"
                        v-t="'game.ui.settings.VisionSettings.default'"
                    ></option>
                    <option
                        :selected="$store.state.visibility.visionMode === 1"
                        v-t="'game.ui.settings.VisionSettings.experimental'"
                    ></option>
                </select>
            </div>
            <div></div>
        </div>
        <div class="row" :class="{ overwritten: location !== null && options.visionMinRange !== undefined }">
            <label :for="'vmininp-' + location">
                {{ $t("game.ui.settings.VisionSettings.min_full_vision_UNIT", { unit: unitSizeUnit }) }}
            </label>
            <div>
                <input :id="'vmininp-' + location" type="number" min="0" v-model.lazy.number="visionMinRange" />
            </div>
            <div
                v-if="location !== null && options.visionMinRange !== undefined"
                @click="reset('visionMinRange')"
                :title="$t('game.ui.settings.common.reset_default')"
            >
                <i aria-hidden="true" class="fas fa-times-circle"></i>
            </div>
            <div v-else></div>
        </div>
        <div class="row" :class="{ overwritten: location !== null && options.visionMaxRange !== undefined }">
            <label :for="'vmaxinp-' + location">
                {{ $t("game.ui.settings.VisionSettings.max_vision_UNIT", { unit: unitSizeUnit }) }}
            </label>
            <div>
                <input :id="'vmaxinp-' + location" type="number" min="0" v-model.lazy.number="visionMaxRange" />
            </div>
            <div
                v-if="location !== null && options.visionMaxRange !== undefined"
                @click="reset('visionMaxRange')"
                :title="$t('game.ui.settings.common.reset_default')"
            >
                <i aria-hidden="true" class="fas fa-times-circle"></i>
            </div>
            <div v-else></div>
        </div>
    </div>
</template>

<style scoped>
/* Force higher specificity without !important abuse */
.panel.restore-panel {
    grid-template-columns: [setting] 1fr [value] 1fr [restore] 30px [end];
}

.overwritten,
.restore-panel .row.overwritten * {
    color: #7c253e;
    font-weight: bold;
}
</style>
