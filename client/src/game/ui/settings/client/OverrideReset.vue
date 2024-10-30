<script setup lang="ts">
import { toRef } from "vue";
import { useI18n } from "vue-i18n";

import { playerSettingsSystem } from "../../../systems/settings/players";
import type { PlayerOptions } from "../../../systems/settings/players/models";
import { playerSettingsState } from "../../../systems/settings/players/state";

const { t } = useI18n();

const props = defineProps<{ setting: keyof PlayerOptions }>();

const override = toRef(playerSettingsState.reactive[props.setting], "override");

function set(
    value: PlayerOptions[typeof props.setting] | undefined,
    options?: { sync?: boolean; default?: PlayerOptions[typeof props.setting] },
): void {
    playerSettingsSystem.getSetter(props.setting)(value, { sync: true, ...options });
}
</script>

<template>
    <template v-if="override !== undefined">
        <div :title="t('game.ui.settings.common.reset_default')" @click="set(undefined)">
            <font-awesome-icon icon="times-circle" />
        </div>
        <div
            :title="t('game.ui.settings.common.sync_default')"
            @click="set(undefined, { sync: true, default: override })"
        >
            <font-awesome-icon icon="sync-alt" />
        </div>
    </template>
</template>
