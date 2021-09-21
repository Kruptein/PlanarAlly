<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { settingsStore } from "../../../../store/settings";
import type { LocationOptions } from "../../../models/settings";

const props = withDefaults(defineProps<{ location?: number }>(), { location: -1 });

const { t } = useI18n();

const isGlobal = computed(() => props.location < 0);

const options = computed(() => {
    if (isGlobal.value) {
        return settingsStore.state.defaultLocationOptions!;
    } else {
        return settingsStore.state.locationOptions.get(props.location) ?? {};
    }
});

const location = computed(() => (isGlobal.value ? undefined : props.location));

const movePlayerOnTokenChange = computed({
    get() {
        return settingsStore.getLocationOptions("movePlayerOnTokenChange", location.value);
    },
    set(movePlayerOnTokenChange: boolean) {
        settingsStore.setMovePlayerOnTokenChange(movePlayerOnTokenChange, location.value, true);
    },
});

function reset(key: keyof LocationOptions): void {
    if (isGlobal.value) return;
    settingsStore.reset(key, props.location);
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
        <div class="row" :class="{ overwritten: !isGlobal && options.movePlayerOnTokenChange !== undefined }">
            <label :for="'movePlayerOnTokenChangeInput-' + location">
                {{ t("game.ui.settings.VariaSettings.movePlayerOnTokenChange") }}
            </label>
            <div>
                <input
                    :id="'movePlayerOnTokenChangeInput-' + location"
                    type="checkbox"
                    v-model="movePlayerOnTokenChange"
                />
            </div>
            <div
                v-if="!isGlobal && options.movePlayerOnTokenChange !== undefined"
                @click="reset('movePlayerOnTokenChange')"
                :title="t('game.ui.settings.common.reset_default')"
            >
                <font-awesome-icon icon="times-circle" />
            </div>
            <div v-else></div>
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
