<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import { BackgroundType, getBackgroundTypeFromString, getBackgroundTypes } from "../../../../game/models/floor";
import { settingsStore } from "../../../../store/settings";
import type { LocationOptions } from "../../../models/settings";
import PatternSettings from "../floor/PatternSettings.vue";

const { t } = useI18n();

const props = withDefaults(defineProps<{ location?: number }>(), { location: -1 });
const backgroundTypes = getBackgroundTypes();
const isGlobal = computed(() => props.location < 0);

const options = computed(() => {
    if (isGlobal.value) {
        return settingsStore.state.defaultLocationOptions!;
    } else {
        return settingsStore.state.locationOptions.get(props.location) ?? {};
    }
});

const location = computed(() => (isGlobal.value ? undefined : props.location));

function getBackgroundValueFromType(type: BackgroundType): string | null {
    switch (type) {
        case BackgroundType.Simple:
            return "rgba(255, 255, 255, 1)";
        case BackgroundType.Pattern:
            return "pattern:empty";
        default:
            return "none";
    }
}

// TODO: Clean up this hack around settingsstore not being reactive when setting things
const invalidateHack = ref(0);

// AIR

const airBackground = computed({
    get() {
        invalidateHack.value;
        return settingsStore.getLocationOptions("airMapBackground", location.value);
    },
    set(airBackground: string | null) {
        settingsStore.setAirMapBackground(airBackground, location.value, true);
    },
});
const airBackgroundType = computed(() => {
    return getBackgroundTypeFromString(airBackground.value);
});

function setAirBackground(background: string): void {
    settingsStore.setAirMapBackground(background, location.value, true);
}

function setAirBackgroundFromEvent(event: Event): void {
    const type = Number.parseInt((event.target as HTMLSelectElement).value);
    airBackground.value = getBackgroundValueFromType(type);
    invalidateHack.value++;
}

// GROUND

const groundBackground = computed({
    get() {
        invalidateHack.value;
        return settingsStore.getLocationOptions("groundMapBackground", location.value);
    },
    set(groundBackground: string | null) {
        settingsStore.setGroundMapBackground(groundBackground, location.value, true);
    },
});
const groundBackgroundType = computed(() => {
    return getBackgroundTypeFromString(groundBackground.value);
});

function setGroundBackground(background: string): void {
    settingsStore.setGroundMapBackground(background, location.value, true);
}

function setGroundBackgroundFromEvent(event: Event): void {
    const type = Number.parseInt((event.target as HTMLSelectElement).value);
    groundBackground.value = getBackgroundValueFromType(type);
    invalidateHack.value++;
}

// UNDERGROUND

const undergroundBackground = computed({
    get() {
        invalidateHack.value;
        return settingsStore.getLocationOptions("undergroundMapBackground", location.value);
    },
    set(undergroundBackground: string | null) {
        settingsStore.setUndergroundMapBackground(undergroundBackground, location.value, true);
    },
});
const undergroundBackgroundType = computed(() => {
    return getBackgroundTypeFromString(undergroundBackground.value);
});

function setUndergroundBackground(background: string): void {
    settingsStore.setUndergroundMapBackground(background, location.value, true);
}

function setUndergroundBackgroundFromEvent(event: Event): void {
    const type = Number.parseInt((event.target as HTMLSelectElement).value);
    undergroundBackground.value = getBackgroundValueFromType(type);
    invalidateHack.value++;
}

// UTILITY

function reset(key: keyof LocationOptions): void {
    if (isGlobal.value) return;
    settingsStore.reset(key, props.location);
}

function e(k: any): boolean {
    return k !== undefined;
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow">
            <template v-if="isGlobal">
                <em style="max-width: 40vw">
                    {{ t("game.ui.settings.common.overridden_msg") }}
                </em>
            </template>
            <template v-else>
                <i18n-t keypath="game.ui.settings.common.overridden_highlight_path" tag="span">
                    <span class="overwritten">{{ t("game.ui.settings.common.overridden_highlight") }}</span>
                </i18n-t>
            </template>
        </div>

        <div class="spanrow header">{{ t("game.ui.settings.FloorSettings.backgrounds") }}</div>

        <div class="row" :class="{ overwritten: !isGlobal && e(options.airMapBackground) }">
            <label :for="'airBackground-' + location">{{ t("game.ui.settings.FloorSettings.air_background") }}</label>
            <div>
                <select :value="airBackgroundType" @change="setAirBackgroundFromEvent">
                    <option v-for="[i, type] of backgroundTypes.entries()" :key="'air-' + i" :value="i">
                        {{ type }}
                    </option>
                </select>
            </div>
            <div
                v-if="!isGlobal && e(options.airMapBackground)"
                @click="reset('airMapBackground')"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" v-show="airBackgroundType === BackgroundType.Simple">
            <div></div>
            <div><ColourPicker :colour="airBackground ?? undefined" @update:colour="setAirBackground($event)" /></div>
            <div></div>
        </div>
        <div class="row" v-show="airBackgroundType === BackgroundType.Pattern">
            <PatternSettings :pattern="airBackground ?? ''" @update:pattern="setAirBackground" />
        </div>

        <div class="row" :class="{ overwritten: !isGlobal && e(options.groundMapBackground) }">
            <label :for="'groundBackground-' + location">
                {{ t("game.ui.settings.FloorSettings.ground_background") }}
            </label>
            <div>
                <select :value="groundBackgroundType" @change="setGroundBackgroundFromEvent">
                    <option v-for="[i, type] of backgroundTypes.entries()" :key="'ground-' + i" :value="i">
                        {{ type }}
                    </option>
                </select>
            </div>
            <div
                v-if="!isGlobal && e(options.groundMapBackground)"
                @click="reset('groundMapBackground')"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" v-show="groundBackgroundType === BackgroundType.Simple">
            <div></div>
            <div>
                <ColourPicker :colour="groundBackground ?? undefined" @update:colour="setGroundBackground($event)" />
            </div>
            <div></div>
        </div>
        <div class="row" v-show="groundBackgroundType === BackgroundType.Pattern">
            <PatternSettings :pattern="groundBackground ?? ''" @update:pattern="setGroundBackground" />
        </div>

        <div class="row" :class="{ overwritten: !isGlobal && e(options.undergroundMapBackground) }">
            <label :for="'undergroundBackground-' + location">
                {{ t("game.ui.settings.FloorSettings.underground_background") }}
            </label>
            <div>
                <select
                    :id="'undergroundBackground-' + location"
                    :value="undergroundBackgroundType"
                    @change="setUndergroundBackgroundFromEvent"
                >
                    <option v-for="[i, type] of backgroundTypes.entries()" :key="'underground-' + i" :value="i">
                        {{ type }}
                    </option>
                </select>
            </div>
            <div
                v-if="!isGlobal && e(options.undergroundMapBackground)"
                @click="reset('undergroundMapBackground')"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" v-show="undergroundBackgroundType === BackgroundType.Simple">
            <div></div>
            <div>
                <ColourPicker
                    :colour="undergroundBackground ?? undefined"
                    @update:colour="setUndergroundBackground($event)"
                />
            </div>
            <div></div>
        </div>
        <div class="row" v-show="undergroundBackgroundType === BackgroundType.Pattern">
            <PatternSettings :pattern="undergroundBackground ?? ''" @update:pattern="setUndergroundBackground" />
        </div>
    </div>
</template>

<style scoped>
/* Force higher specificity without !important abuse */
.panel.restore-panel {
    grid-template-columns: [setting] 1fr [value] auto [restore] 30px [end];
}

.overwritten,
.restore-panel .row.overwritten * {
    color: #7c253e;
    font-weight: bold;
}
</style>
