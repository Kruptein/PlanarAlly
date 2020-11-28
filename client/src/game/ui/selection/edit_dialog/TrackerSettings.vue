<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Prop } from "vue-property-decorator";

import ColorPicker from "@/core/components/colorpicker.vue";

import { Shape } from "@/game/shapes/shape";
import { Aura, Tracker } from "@/game/shapes/interfaces";

@Component({ components: { ColorPicker } })
export default class TrackerSettings extends Vue {
    @Prop() shape!: Shape;
    @Prop() owned!: boolean;

    updateTracker<T extends keyof Tracker>(tracker: Tracker, key: T, value: Tracker[T], sync = true): void {
        if (tracker.temporary) {
            // update client side version with new key, but don't sync it
            this.shape.updateTracker(tracker.uuid, { [key]: value }, false);
            // do a full sync, creating the tracker server side
            this.shape.syncTracker(tracker);
        } else {
            this.shape.updateTracker(tracker.uuid, { [key]: value }, sync);
        }
    }

    updateAura<T extends keyof Aura>(aura: Aura, key: T, value: Aura[T], sync = true): void {
        if (aura.temporary) {
            // update client side version with new key, but don't sync it
            this.shape.updateAura(aura.uuid, { [key]: value }, false);
            // do a full sync, creating the aura server side
            this.shape.syncAura(aura);
        } else {
            this.shape.updateAura(aura.uuid, { [key]: value }, sync);
        }
    }

    removeTracker(uuid: string): void {
        if (!this.owned) return;
        this.shape.removeTracker(uuid, true);
    }

    removeAura(uuid: string): void {
        if (!this.owned) return;
        this.shape.removeAura(uuid, true);
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
                @change="updateTracker(tracker, 'name', $event.target.value)"
                type="text"
                :placeholder="$t('common.name')"
                style="grid-column-start: name"
                :disabled="!owned"
            />
            <input
                :key="'value-' + tracker.uuid"
                :value="tracker.value"
                @change="updateTracker(tracker, 'value', parseFloat($event.target.value))"
                type="text"
                :title="$t('game.ui.selection.edit_dialog.dialog.current_value')"
                :disabled="!owned"
            />
            <span :key="'fspan-' + tracker.uuid">/</span>
            <input
                :key="'maxvalue-' + tracker.uuid"
                :value="tracker.maxvalue"
                @change="updateTracker(tracker, 'maxvalue', $event.target.value)"
                type="text"
                :title="$t('game.ui.selection.edit_dialog.dialog.current_value')"
                :disabled="!owned"
            />
            <span :key="'sspan-' + tracker.uuid"></span>
            <div
                :key="'visibility-' + tracker.uuid"
                :style="{ opacity: tracker.visible ? 1.0 : 0.3, textAlign: 'center' }"
                @click="updateTracker(tracker, 'visible', !tracker.visible)"
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
                @change="updateAura(aura, 'name', $event.target.value)"
                type="text"
                :placeholder="$t('common.name')"
                style="grid-column-start: name"
                :disabled="!owned"
            />
            <input
                :key="'value-' + aura.uuid"
                :value="aura.value"
                @change="updateAura(aura, 'value', parseFloat($event.target.value))"
                type="text"
                :title="$t('game.ui.selection.edit_dialog.dialog.current_value')"
                :disabled="!owned"
            />
            <span :key="'fspan-' + aura.uuid">/</span>
            <input
                :key="'dimvalue-' + aura.uuid"
                :value="aura.dim"
                @change="updateAura(aura, 'dim', parseFloat($event.target.value))"
                type="text"
                :title="$t('game.ui.selection.edit_dialog.dialog.dim_value')"
                :disabled="!owned"
            />
            <color-picker
                :key="'colour-' + aura.uuid"
                :color="aura.colour"
                @input="updateAura(aura, 'colour', $event, false)"
                @change="updateAura(aura, 'colour', $event)"
                :disabled="!owned"
            />
            <div
                :key="'visibility-' + aura.uuid"
                :style="{ opacity: aura.visible ? 1.0 : 0.3, textAlign: 'center' }"
                @click="updateAura(aura, 'visible', !aura.visible)"
                :disabled="!owned"
                :title="$t('common.toggle_public_private')"
            >
                <font-awesome-icon icon="eye" />
            </div>
            <div
                :key="'visionsource-' + aura.uuid"
                :style="{ opacity: aura.visionSource ? 1.0 : 0.3, textAlign: 'center' }"
                @click="updateAura(aura, 'visionSource', !aura.visionSource)"
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
    grid-template-columns: [name] 1fr [numerator] 25px [slash] 5px [denominator] 25px [colour] auto [visible] auto [light] auto [remove] auto [end];
    grid-column-gap: 10px;
    align-items: center;
    padding-bottom: 1em;
    justify-items: center;
}

input[type="text"] {
    padding: 2px;
}
</style>
