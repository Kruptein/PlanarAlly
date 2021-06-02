<script lang="ts">
import { computed, defineComponent, toRef } from "vue";
import { useI18n } from "vue-i18n";

import { gameStore } from "../../../../store/game";
import { settingsStore } from "../../../../store/settings";
import { LocationOptions } from "../../../models/settings";

export default defineComponent({
    props: { location: { type: Number, default: -1 } },
    setup(props) {
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

        return {
            fakePlayer: toRef(gameStore.state, "isFakePlayer"),
            isGlobal,
            options,
            reset,
            t,

            movePlayerOnTokenChange,
        };
    },
});
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
            <label
                :for="'movePlayerOnTokenChangeInput-' + location"
                v-t="'game.ui.settings.VariaSettings.movePlayerOnTokenChange'"
            ></label>
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
