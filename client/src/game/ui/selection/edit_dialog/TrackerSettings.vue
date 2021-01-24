<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import ColorPicker from "@/core/components/colorpicker.vue";

import { SyncTo } from "../../../../core/comm/types";
import { sendShapeMoveAura, sendShapeMoveTracker } from "../../../api/emits/shape/options";
import { Aura, Tracker } from "../../../shapes/interfaces";
import { ActiveShapeState, activeShapeStore } from "../../ActiveShapeStore";

@Component({ components: { ColorPicker } })
export default class TrackerSettings extends Vue {
    get owned(): boolean {
        return activeShapeStore.hasEditAccess;
    }

    get shape(): ActiveShapeState {
        return activeShapeStore;
    }

    // Tracker

    updateTracker(tracker: string, delta: Partial<Tracker>): void {
        if (!this.owned) return;
        if (this.shape.uuid) this.shape.updateTracker({ tracker, delta, syncTo: SyncTo.SERVER });
    }

    removeTracker(tracker: string): void {
        if (!this.owned) return;
        this.shape.removeTracker({ tracker, syncTo: SyncTo.SERVER });
    }

    toggleCompositeTracker(trackerId: string): void {
        if (!this.owned) return;
        if (!this.shape.isComposite) return;

        const tracker = this.shape.trackers.find((t) => t.uuid === trackerId);
        if (tracker === undefined) return;

        this.shape.removeTracker({ tracker: trackerId, syncTo: SyncTo.SHAPE });

        const oldShape = tracker.shape;
        if (oldShape === this.shape.uuid) {
            tracker.shape = this.shape.parentUuid!;
        } else {
            tracker.shape = this.shape.uuid!;
        }

        this.shape.pushTracker({ tracker, shape: tracker.shape, syncTo: SyncTo.SHAPE });
        sendShapeMoveTracker({ shape: oldShape, new_shape: tracker.shape, tracker: tracker.uuid });
    }

    // Aura

    updateAura(aura: string, delta: Partial<Aura>, syncTo = true): void {
        if (!this.owned) return;
        if (this.shape.uuid)
            this.shape.updateAura({ aura, delta, syncTo: syncTo === true ? SyncTo.SERVER : SyncTo.SHAPE });
    }

    removeAura(aura: string): void {
        if (!this.owned) return;
        this.shape.removeAura({ aura, syncTo: SyncTo.SERVER });
    }

    toggleCompositeAura(auraId: string): void {
        if (!this.owned) return;
        if (!this.shape.isComposite) return;

        const aura = this.shape.auras.find((t) => t.uuid === auraId);
        if (aura === undefined) return;

        this.shape.removeAura({ aura: auraId, syncTo: SyncTo.SHAPE });

        const oldShape = aura.shape;
        if (oldShape === this.shape.uuid) {
            aura.shape = this.shape.parentUuid!;
        } else {
            aura.shape = this.shape.uuid!;
        }

        this.shape.pushAura({ aura, shape: aura.shape, syncTo: SyncTo.SHAPE });
        sendShapeMoveAura({ shape: oldShape, new_shape: aura.shape, aura: aura.uuid });
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header" v-t="'common.trackers'"></div>
        <template v-for="tracker in shape.trackers">
            <input
                :key="'name-' + tracker.uuid"
                :value="tracker.name"
                @change="updateTracker(tracker.uuid, { name: $event.target.value })"
                type="text"
                :placeholder="$t('common.name')"
                style="grid-column-start: name"
                :disabled="!owned"
            />
            <input
                :key="'value-' + tracker.uuid"
                :value="tracker.value"
                @change="updateTracker(tracker.uuid, { value: parseFloat($event.target.value) })"
                type="text"
                :title="$t('game.ui.selection.edit_dialog.dialog.current_value')"
                :disabled="!owned"
            />
            <span :key="'fspan-' + tracker.uuid">/</span>
            <input
                :key="'maxvalue-' + tracker.uuid"
                :value="tracker.maxvalue"
                @change="updateTracker(tracker.uuid, { maxvalue: $event.target.value })"
                type="text"
                :title="$t('game.ui.selection.edit_dialog.dialog.current_value')"
                :disabled="!owned"
            />
            <span :key="'sspan-' + tracker.uuid"></span>
            <div
                v-show="shape.isComposite"
                :key="'lock-' + tracker.uuid"
                :style="{ opacity: tracker.shape !== shape.uuid ? 1.0 : 0.3, textAlign: 'center' }"
                @click="toggleCompositeTracker(tracker.uuid)"
                :disabled="!owned"
                :title="$t('common.toggle_public_private')"
            >
                <font-awesome-icon icon="lock" />
            </div>
            <div
                :key="'visibility-' + tracker.uuid"
                :style="{ opacity: tracker.visible ? 1.0 : 0.3, textAlign: 'center' }"
                @click="updateTracker(tracker.uuid, { visible: !tracker.visible })"
                :disabled="!owned"
                :title="$t('common.toggle_public_private')"
            >
                <font-awesome-icon icon="eye" />
            </div>
            <span :key="'tspan-' + tracker.uuid"></span>
            <div
                v-if="!tracker.temporary"
                :key="'remove-' + tracker.uuid"
                @click="removeTracker(tracker.uuid)"
                :disabled="!owned"
                :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center' }"
                :title="$t('game.ui.selection.edit_dialog.dialog.remove_tracker')"
            >
                <font-awesome-icon icon="trash-alt" />
            </div>
        </template>
        <div class="spanrow header" v-t="'common.auras'"></div>
        <template v-for="aura in shape.auras">
            <input
                :key="'name-' + aura.uuid"
                :value="aura.name"
                @change="updateAura(aura.uuid, { name: $event.target.value })"
                type="text"
                :placeholder="$t('common.name')"
                style="grid-column-start: name"
                :disabled="!owned"
            />
            <input
                :key="'value-' + aura.uuid"
                :value="aura.value"
                @change="updateAura(aura.uuid, { value: parseFloat($event.target.value) })"
                type="text"
                :title="$t('game.ui.selection.edit_dialog.dialog.current_value')"
                :disabled="!owned"
            />
            <span :key="'fspan-' + aura.uuid">/</span>
            <input
                :key="'dimvalue-' + aura.uuid"
                :value="aura.dim"
                @change="updateAura(aura.uuid, { dim: parseFloat($event.target.value) })"
                type="text"
                :title="$t('game.ui.selection.edit_dialog.dialog.dim_value')"
                :disabled="!owned"
            />
            <color-picker
                :key="'colour-' + aura.uuid"
                :color="aura.colour"
                @input="updateAura(aura.uuid, { colour: $event }, false)"
                @change="updateAura(aura.uuid, { colour: $event })"
                :disabled="!owned"
            />
            <div
                v-show="shape.isComposite"
                :key="'lock-' + aura.uuid"
                :style="{ opacity: aura.shape !== shape.uuid ? 1.0 : 0.3, textAlign: 'center' }"
                @click="toggleCompositeAura(aura.uuid)"
                :disabled="!owned"
                :title="$t('common.toggle_public_private')"
            >
                <font-awesome-icon icon="lock" />
            </div>
            <div
                :key="'visibility-' + aura.uuid"
                :style="{ opacity: aura.visible ? 1.0 : 0.3, textAlign: 'center' }"
                @click="updateAura(aura.uuid, { visible: !aura.visible })"
                :disabled="!owned"
                :title="$t('common.toggle_public_private')"
            >
                <font-awesome-icon icon="eye" />
            </div>
            <div
                :key="'visionsource-' + aura.uuid"
                :style="{ opacity: aura.visionSource ? 1.0 : 0.3, textAlign: 'center' }"
                @click="updateAura(aura.uuid, { visionSource: !aura.visionSource })"
                :disabled="!owned"
                :title="$t('game.ui.selection.edit_dialog.dialog.toggle_light_source')"
            >
                <font-awesome-icon icon="lightbulb" />
            </div>
            <div
                v-if="!aura.temporary"
                :key="'remove-' + aura.uuid"
                @click="removeAura(aura.uuid)"
                :disabled="!owned"
                :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center' }"
                :title="$t('game.ui.selection.edit_dialog.dialog.delete_aura')"
            >
                <font-awesome-icon icon="trash-alt" />
            </div>
        </template>
    </div>
</template>

<style scoped>
.panel {
    grid-template-columns: [name] 1fr [numerator] 25px [slash] 5px [denominator] 25px [colour] auto [lock] auto [visible] auto [light] auto [remove] auto [end];
    grid-column-gap: 10px;
    align-items: center;
    padding-bottom: 1em;
    justify-items: center;
}

input[type="text"] {
    padding: 2px;
}
</style>
