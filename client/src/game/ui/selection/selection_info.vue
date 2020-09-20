<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import Game from "@/game/Game.vue";
import ShapeSettings from "@/game/ui/selection/edit_dialog/ShapeSettings.vue";

import { EventBus } from "@/game/event-bus";
import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";
import { sendTrackerUpdate } from "@/game/api/emits/shape/core";
import { Aura, Tracker } from "@/game/shapes/interfaces";

@Component({
    components: {
        ShapeSettings,
    },
})
export default class SelectionInfo extends Vue {
    shape: Shape | null = null;

    mounted(): void {
        EventBus.$on("Shape.Set", (shape: Shape) => {
            if (this.shape && shape.uuid === this.shape.uuid) {
                this.shape = shape;
            }
        });
        EventBus.$on("SelectionInfo.Shapes.Set", (shapes: Shape[]) => {
            // todo: multiple selected shapes
            if (shapes.length === 1) this.shape = shapes[0];
            else this.shape = null;
        });
    }

    beforeDestroy(): void {
        EventBus.$off("SelectionInfo.Shapes.Set");
    }

    get shapes(): Shape[] {
        if (this.shape === null) return [];
        return [this.shape];
    }

    get visibleTrackers(): Tracker[] {
        if (this.shape === null) return [];
        return this.shape.trackers.filter(tr => tr.name !== "" || tr.value !== 0);
    }

    get visibleAuras(): Aura[] {
        if (this.shape === null) return [];
        return this.shape.auras.filter(au => au.name !== "" || au.value !== 0);
    }

    openEditDialog(): void {
        (this.$refs.shapeSettings as any)[0].visible = true;
    }
    async changeValue(object: Tracker | Aura, isAura: boolean): Promise<void> {
        if (this.shape === null) return;
        const value = await (this.$parent.$parent as Game).$refs.prompt.prompt(
            this.$t("game.ui.selection.select_info.new_value_NAME", { name: object.name }).toString(),
            this.$t("game.ui.selection.select_info.updating_NAME", { name: object.name }).toString(),
        );
        if (this.shape === null) return;
        const ogValue = object.value;

        if (value[0] === "+" || value[0] === "-") object.value += parseInt(value, 10);
        else object.value = parseInt(value, 10);

        const _type = isAura ? "aura" : "tracker";

        if (isNaN(object.value)) object.value = ogValue;
        else sendTrackerUpdate({ uuid: object.uuid, value: object.value, shape: this.shape.uuid, _type });
        if (isAura) layerManager.invalidate(this.shape.floor);
    }
}
</script>

<template>
    <div v-show="shapes.length > 0">
        <div v-for="shape in shapes" :key="shape.uuid">
            <div id="selection-menu">
                <div
                    id="selection-lock-button"
                    @click="!!shape.ownedBy({ editAccess: true }) && shape.setLocked(!shape.isLocked, true)"
                    :title="$t('game.ui.selection.select_info.lock')"
                >
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
                    <template v-for="tracker in visibleTrackers">
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
                    <template v-for="aura in visibleAuras">
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
            <ShapeSettings ref="shapeSettings" :shape="shape"></ShapeSettings>
        </div>
    </div>
</template>

<style scoped>
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
}

#selection-menu:hover {
    background-color: #82c8a0;
    opacity: 1;
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
}

.selection-tracker-value:hover,
.selection-aura-value:hover {
    cursor: pointer;
    background-color: rgba(20, 20, 20, 0.2);
}

#selection-name {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
}
</style>
