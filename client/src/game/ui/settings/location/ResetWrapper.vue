<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { locationSettingsSystem } from "../../../systems/settings/location";
import type { LocationOptions } from "../../../systems/settings/location/models";
import { locationSettingsState } from "../../../systems/settings/location/state";

const { t } = useI18n();

const props = defineProps<{ global: boolean; location: number | undefined; setting: keyof LocationOptions }>();

function o(k: any): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return locationSettingsState.getOption(k, props.location).override !== undefined;
}
</script>

<template>
    <div class="row" :class="{ overwritten: !global && o(locationSettingsState.reactive[setting]) }">
        <slot />
        <div
            v-if="!global && o(locationSettingsState.reactive[setting])"
            :title="t('game.ui.settings.common.reset_default')"
            @click="locationSettingsSystem.getSetter(setting)(undefined, location, true)"
        >
            <font-awesome-icon icon="times-circle" />
        </div>
        <div v-else></div>
    </div>
</template>
