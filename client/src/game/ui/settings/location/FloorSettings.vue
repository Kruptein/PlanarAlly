<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import { BackgroundType, getBackgroundTypeFromString, getBackgroundTypes } from "../../../../game/models/floor";
import { locationSettingsSystem } from "../../../systems/settings/location";
import { locationSettingsState } from "../../../systems/settings/location/state";
import PatternSettings from "../floor/PatternSettings.vue";

const props = withDefaults(defineProps<{ location?: number }>(), { location: -1 });

const { t } = useI18n();

const { reactive: $, getOption } = locationSettingsState;
const lss = locationSettingsSystem;

const isGlobal = computed(() => props.location < 0);
const location = computed(() => (isGlobal.value ? undefined : props.location));

const backgroundTypes = getBackgroundTypes();

function getBackgroundValueFromType(type: BackgroundType): string {
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
        return getOption($.airMapBackground, location.value).value;
    },
    set(airBackground: string | undefined) {
        lss.setAirMapBackground(airBackground, location.value, true);
    },
});
const airBackgroundType = computed(() => {
    return getBackgroundTypeFromString(airBackground.value!);
});

function setAirBackgroundFromEvent(event: Event): void {
    const type = Number.parseInt((event.target as HTMLSelectElement).value);
    airBackground.value = getBackgroundValueFromType(type);
    invalidateHack.value++;
}

// GROUND

const groundBackground = computed({
    get() {
        invalidateHack.value;
        return getOption($.groundMapBackground, location.value).value;
    },
    set(groundBackground: string | undefined) {
        lss.setGroundMapBackground(groundBackground, location.value, true);
    },
});
const groundBackgroundType = computed(() => {
    return getBackgroundTypeFromString(groundBackground.value!);
});

function setGroundBackgroundFromEvent(event: Event): void {
    const type = Number.parseInt((event.target as HTMLSelectElement).value);
    groundBackground.value = getBackgroundValueFromType(type);
    invalidateHack.value++;
}

// UNDERGROUND

const undergroundBackground = computed({
    get() {
        invalidateHack.value;
        return getOption($.undergroundMapBackground, location.value).value;
    },
    set(undergroundBackground: string | undefined) {
        lss.setUndergroundMapBackground(undergroundBackground, location.value, true);
    },
});
const undergroundBackgroundType = computed(() => {
    return getBackgroundTypeFromString(undergroundBackground.value!);
});

function setUndergroundBackgroundFromEvent(event: Event): void {
    const type = Number.parseInt((event.target as HTMLSelectElement).value);
    undergroundBackground.value = getBackgroundValueFromType(type);
    invalidateHack.value++;
}

function o(k: any): boolean {
    return getOption(k, location.value).override !== undefined;
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

        <div class="row" :class="{ overwritten: !isGlobal && o($.airMapBackground) }">
            <label :for="'airBackground-' + location">{{ t("game.ui.settings.FloorSettings.air_background") }}</label>
            <div>
                <select :value="airBackgroundType" @change="setAirBackgroundFromEvent">
                    <option v-for="[i, type] of backgroundTypes.entries()" :key="'air-' + i" :value="i">
                        {{ type }}
                    </option>
                </select>
            </div>
            <div
                v-if="!isGlobal && o($.airMapBackground)"
                @click="airBackground = undefined"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" v-show="airBackgroundType === BackgroundType.Simple">
            <div></div>
            <div><ColourPicker :colour="airBackground ?? undefined" @update:colour="airBackground = $event" /></div>
            <div></div>
        </div>
        <div class="row" v-show="airBackgroundType === BackgroundType.Pattern">
            <PatternSettings :pattern="airBackground ?? ''" @update:pattern="airBackground = $event" />
        </div>

        <div class="row" :class="{ overwritten: !isGlobal && o($.groundMapBackground) }">
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
                v-if="!isGlobal && o($.groundMapBackground)"
                @click="groundBackground = undefined"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
        </div>
        <div class="row" v-show="groundBackgroundType === BackgroundType.Simple">
            <div></div>
            <div>
                <ColourPicker :colour="groundBackground ?? undefined" @update:colour="groundBackground = $event" />
            </div>
            <div></div>
        </div>
        <div class="row" v-show="groundBackgroundType === BackgroundType.Pattern">
            <PatternSettings :pattern="groundBackground ?? ''" @update:pattern="groundBackground = $event" />
        </div>

        <div class="row" :class="{ overwritten: !isGlobal && o($.undergroundMapBackground) }">
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
                v-if="!isGlobal && o($.undergroundMapBackground)"
                @click="undergroundBackground = undefined"
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
                    @update:colour="undergroundBackground = $event"
                />
            </div>
            <div></div>
        </div>
        <div class="row" v-show="undergroundBackgroundType === BackgroundType.Pattern">
            <PatternSettings :pattern="undergroundBackground ?? ''" @update:pattern="undergroundBackground = $event" />
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
