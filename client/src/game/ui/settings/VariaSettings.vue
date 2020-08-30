<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

import { gameSettingsStore, getLocationOption } from "../../settings";
import { LocationOptions } from "../../comm/types/settings";

@Component
export default class VariaSettings extends Vue {
    @Prop() location!: number | null;

    get defaults(): LocationOptions {
        return gameSettingsStore.defaultLocationOptions!;
    }

    get options(): Partial<LocationOptions> {
        if (this.location === null) return this.defaults;
        return gameSettingsStore.locationOptions[this.location] ?? {};
    }

    get movePlayerOnTokenChange(): boolean {
        return getLocationOption("movePlayerOnTokenChange", this.location)!;
    }
    set movePlayerOnTokenChange(value: boolean) {
        gameSettingsStore.setMovePlayerOnTokenChange({
            movePlayerOnTokenChange: value,
            location: this.location,
            sync: true,
        });
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
        <div class="row" :class="{ overwritten: location !== null && options.movePlayerOnTokenChange !== undefined }">
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
                v-if="location !== null && options.movePlayerOnTokenChange !== undefined"
                @click="reset('movePlayerOnTokenChange')"
                :title="$t('game.ui.settings.common.reset_default')"
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
