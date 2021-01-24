<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import Prompt from "@/core/components/modals/prompt.vue";
import { layerManager } from "@/game/layers/manager";
import { Aura, Tracker } from "@/game/shapes/interfaces";
import ShapeSettings from "@/game/ui/selection/edit_dialog/ShapeSettings.vue";

import { SyncTo } from "../../../core/comm/types";
import { ActiveShapeState, activeShapeStore } from "../ActiveShapeStore";

@Component({
    components: {
        Prompt,
        ShapeSettings,
    },
})
export default class SelectionInfo extends Vue {
    $refs!: {
        prompt: Prompt;
        shapeSettings: ShapeSettings;
    };

    get shape(): ActiveShapeState {
        return activeShapeStore;
    }

    openEditDialog(): void {
        this.$refs.shapeSettings.setVisible(true);
    }

    setLocked(): void {
        if (this.shape.hasEditAccess) {
            this.shape.setLocked({ isLocked: !this.shape.isLocked, syncTo: SyncTo.SERVER });
        }
    }

    async changeValue(tracker: Tracker | Aura, isAura: boolean): Promise<void> {
        if (this.shape.uuid === undefined) return;

        const input = await this.$refs.prompt.prompt(
            this.$t("game.ui.selection.select_info.new_value_NAME", { name: tracker.name }).toString(),
            this.$t("game.ui.selection.select_info.updating_NAME", { name: tracker.name }).toString(),
        );

        if (input === undefined || this.shape.uuid === undefined) return;
        const _type = isAura ? "aura" : "tracker";

        let value = parseInt(input, 10);
        if (isNaN(value)) {
            return;
        }

        if (input[0] === "+" || input[0] === "-") {
            value += tracker.value;
        }

        if (isAura) {
            activeShapeStore.updateAura({ aura: tracker.uuid, delta: { value }, syncTo: SyncTo.SERVER });
            const shape = layerManager.UUIDMap.get(this.shape.uuid!)!;
            shape.invalidate(false);
        } else {
            activeShapeStore.updateTracker({ tracker: tracker.uuid, delta: { value }, syncTo: SyncTo.SERVER });
        }
    }
}
</script>

<template>
    <div>
        <ShapeSettings ref="shapeSettings" />
        <Prompt ref="prompt"></Prompt>
        <template v-if="shape.uuid !== undefined">
            <div id="selection-menu">
                <div id="selection-lock-button" @click="setLocked" :title="$t('game.ui.selection.select_info.lock')">
                    <font-awesome-icon v-if="shape.isLocked" icon="lock" />
                    <font-awesome-icon v-else icon="unlock" />
                </div>
                <div
                    id="selection-edit-button"
                    @click="openEditDialog"
                    :title="$t('game.ui.selection.select_info.open_shape_props')"
                >
                    <font-awesome-icon icon="edit" />
                </div>
                <div id="selection-name">{{ shape.name }}</div>
                <div id="selection-trackers">
                    <template v-for="tracker in shape.trackers.slice(0, shape.trackers.length - 1)">
                        <div :key="'name-' + tracker.uuid">{{ tracker.name }}</div>
                        <div
                            class="selection-tracker-value"
                            :key="'value-' + tracker.uuid"
                            @click="changeValue(tracker, false)"
                            :title="$t('game.ui.selection.select_info.quick_edit_tracker')"
                        >
                            <template v-if="tracker.maxvalue === 0">
                                {{ tracker.value }}
                            </template>
                            <template v-else>{{ tracker.value }} / {{ tracker.maxvalue }}</template>
                        </div>
                    </template>
                </div>
                <div id="selection-auras">
                    <template v-for="aura in shape.auras.slice(0, shape.auras.length - 1)">
                        <div :key="'name-' + aura.uuid">{{ aura.name }}</div>
                        <div
                            class="selection-tracker-value"
                            :key="'value-' + aura.uuid"
                            @click="changeValue(aura, true)"
                            :title="$t('game.ui.selection.select_info.quick_edit_aura')"
                        >
                            <template v-if="aura.dim === 0">
                                {{ aura.value }}
                            </template>
                            <template v-else>{{ aura.value }} / {{ aura.dim }}</template>
                        </div>
                    </template>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped lang="scss">
#selection-menu {
    position: absolute;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    top: 75px;
    right: 0;
    z-index: 10;
    opacity: 0.5;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
    border: #82c8a0 solid 1px;
    border-right: none;
    padding: 10px 35px 10px 10px;
    background-color: #eee;

    &:hover {
        background-color: #82c8a0;
        opacity: 1;
    }
}

#selection-lock-button {
    position: absolute;
    right: 13px;
    top: 30px;
    cursor: pointer;
}

#selection-edit-button {
    position: absolute;
    right: 10px;
    top: 10px;
    cursor: pointer;
}

#selection-trackers,
#selection-auras {
    display: grid;
    grid-template-columns: [name] 1fr [value] 1fr;
}

.selection-tracker-value,
.selection-aura-value {
    justify-self: center;
    padding: 2px;

    &:hover {
        cursor: pointer;
        background-color: rgba(20, 20, 20, 0.2);
    }
}

#selection-name {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
}
</style>
