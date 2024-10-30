<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import { BackgroundType, getBackgroundTypeFromString, getBackgroundTypes } from "../../../../game/models/floor";
import { uiState } from "../../../systems/ui/state";
import PatternSettings from "../floor/PatternSettings.vue";

import ResetWrapper from "./ResetWrapper.vue";
import { useLocationSettings } from "./useLocationSettings";

const props = defineProps<{ global: boolean }>();

const { t } = useI18n();

const location = computed(() => (props.global ? undefined : uiState.reactive.openedLocationSettings));

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

// AIR

const airBackground = useLocationSettings("airMapBackground", location);
const airBackgroundType = computed(() => {
    return getBackgroundTypeFromString(airBackground.value!);
});

function setAirBackgroundFromEvent(event: Event): void {
    const type = Number.parseInt((event.target as HTMLSelectElement).value);
    airBackground.value = getBackgroundValueFromType(type);
}

// GROUND

const groundBackground = useLocationSettings("groundMapBackground", location);
const groundBackgroundType = computed(() => {
    return getBackgroundTypeFromString(groundBackground.value!);
});

function setGroundBackgroundFromEvent(event: Event): void {
    const type = Number.parseInt((event.target as HTMLSelectElement).value);
    groundBackground.value = getBackgroundValueFromType(type);
}

// UNDERGROUND

const undergroundBackground = useLocationSettings("undergroundMapBackground", location);
const undergroundBackgroundType = computed(() => {
    return getBackgroundTypeFromString(undergroundBackground.value!);
});

function setUndergroundBackgroundFromEvent(event: Event): void {
    const type = Number.parseInt((event.target as HTMLSelectElement).value);
    undergroundBackground.value = getBackgroundValueFromType(type);
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow">
            <template v-if="global">
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

        <ResetWrapper :global="global" :location="location" setting="airMapBackground">
            <label :for="'airBackground-' + location">{{ t("game.ui.settings.FloorSettings.air_background") }}</label>
            <div>
                <select :value="airBackgroundType" @change="setAirBackgroundFromEvent">
                    <option v-for="[i, type] of backgroundTypes.entries()" :key="'air-' + i" :value="i">
                        {{ type }}
                    </option>
                </select>
            </div>
        </ResetWrapper>
        <div v-show="airBackgroundType === BackgroundType.Simple" class="row">
            <div></div>
            <div><ColourPicker :colour="airBackground ?? undefined" @update:colour="airBackground = $event" /></div>
            <div></div>
        </div>
        <div v-show="airBackgroundType === BackgroundType.Pattern" class="row">
            <PatternSettings :pattern="airBackground ?? ''" @update:pattern="airBackground = $event" />
        </div>

        <ResetWrapper :global="global" :location="location" setting="groundMapBackground">
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
        </ResetWrapper>
        <div v-show="groundBackgroundType === BackgroundType.Simple" class="row">
            <div></div>
            <div>
                <ColourPicker :colour="groundBackground ?? undefined" @update:colour="groundBackground = $event" />
            </div>
            <div></div>
        </div>
        <div v-show="groundBackgroundType === BackgroundType.Pattern" class="row">
            <PatternSettings :pattern="groundBackground ?? ''" @update:pattern="groundBackground = $event" />
        </div>

        <ResetWrapper :global="global" :location="location" setting="undergroundMapBackground">
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
        </ResetWrapper>
        <div v-show="undergroundBackgroundType === BackgroundType.Simple" class="row">
            <div></div>
            <div>
                <ColourPicker
                    :colour="undergroundBackground ?? undefined"
                    @update:colour="undergroundBackground = $event"
                />
            </div>
            <div></div>
        </div>
        <div v-show="undergroundBackgroundType === BackgroundType.Pattern" class="row">
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
