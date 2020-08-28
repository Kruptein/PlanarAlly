<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Prop } from "vue-property-decorator";

import ColorPicker from "@/core/components/colorpicker.vue";
import Modal from "@/core/components/modals/modal.vue";
import EditDialogAccess from "./access.vue";

import { uuidv4 } from "@/core/utils";
import { EventBus } from "@/game/event-bus";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";

@Component({
    components: {
        EditDialogAccess,
        Modal,
        "color-picker": ColorPicker,
    },
})
export default class EditDialog extends Vue {
    @Prop() shape!: Shape;

    visible = false;

    get owned(): boolean {
        return this.shape.ownedBy({ editAccess: true });
    }

    mounted(): void {
        EventBus.$on("EditDialog.Open", (shape: Shape) => {
            this.shape = shape;
            this.visible = true;
        });
        EventBus.$on("EditDialog.AddLabel", (label: string) => {
            if (this.visible) {
                this.shape.labels.push(gameStore.labels[label]);
                console.log("Label refresh");
            }
        });
    }

    beforeDestroy(): void {
        EventBus.$off("EditDialog.Open");
        EventBus.$off("EditDialog.AddLabel");
    }

    updated(): void {
        this.addEmpty();
    }

    addEmpty(): void {
        if (this.shape.trackers.length === 0 || !this.shape.trackers[this.shape.trackers.length - 1].temporary)
            this.shape.pushTracker({
                uuid: uuidv4(),
                name: "",
                value: 0,
                maxvalue: 0,
                visible: false,
                temporary: true,
            });
        if (this.shape.auras.length === 0 || !this.shape.auras[this.shape.auras.length - 1].temporary)
            this.shape.pushAura({
                uuid: uuidv4(),
                name: "",
                value: 0,
                dim: 0,
                visionSource: false,
                colour: "rgba(0,0,0,0)",
                visible: false,
                temporary: true,
            });
    }
    setToken(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setIsToken(event.target.checked, true);
    }
    setInvisible(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setInvisible(event.target.checked, true);
    }
    setLocked(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setLocked(event.target.checked, true);
    }
    toggleBadge(_event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        const groupMembers = this.shape.getGroupMembers();
        for (const shape of groupMembers) this.shape.setShowBadge(!shape.showBadge, true);
    }
    setVisionBlocker(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setVisionBlock(event.target.checked, true);
    }
    setMovementBlocker(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setMovementBlock(event.target.checked, true);
    }
    updateAnnotation(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setAnnotation(event.target.value, true);
    }
    removeTracker(uuid: string): void {
        if (!this.owned) return;
        this.shape.removeTracker(uuid, true);
    }
    removeAura(uuid: string): void {
        if (!this.owned) return;
        this.shape.removeAura(uuid, true);
    }
    openLabelManager(): void {
        EventBus.$emit("LabelManager.Open");
    }
    removeLabel(uuid: string): void {
        if (!this.owned) return;
        this.shape.removeLabel(uuid, true);
    }
    updateName(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setName(event.target.value, true);
    }
    toggleNameVisible(): void {
        this.shape.setNameVisible(!this.shape.nameVisible, true);
    }
    setStrokeColour(event: string, temporary: boolean): void {
        this.shape.setStrokeColour(event, !temporary);
    }
    setFillColour(event: string, temporary: boolean): void {
        this.shape.setFillColour(event, !temporary);
    }

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
}
</script>

<template>
    <Modal :visible="visible" @close="visible = false" :mask="false">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <div v-t="'game.ui.selection.edit_dialog.dialog.edit_asset'"></div>
            <div class="header-close" @click="visible = false" :title="$t('common.close')">
                <font-awesome-icon :icon="['far', 'window-close']" />
            </div>
        </div>
        <div class="modal-body">
            <div class="grid">
                <label for="shapeselectiondialog-name" v-t="'common.name'"></label>
                <input
                    type="text"
                    id="shapeselectiondialog-name"
                    :value="shape.name"
                    @change="updateName"
                    :disabled="!owned"
                    style="grid-column: numerator / remove"
                />
                <div
                    :style="{ opacity: shape.nameVisible ? 1.0 : 0.3, textAlign: 'center' }"
                    @click="toggleNameVisible"
                    :disabled="!owned"
                    :title="$t('common.toggle_public_private')"
                >
                    <font-awesome-icon icon="eye" />
                </div>
                <label
                    for="shapeselectiondialog-istoken"
                    v-t="'game.ui.selection.edit_dialog.dialog.is_a_token'"
                ></label>
                <input
                    type="checkbox"
                    id="shapeselectiondialog-istoken"
                    :checked="shape.isToken"
                    @click="setToken"
                    style="grid-column-start: remove;"
                    class="styled-checkbox"
                    :disabled="!owned"
                />
                <label
                    for="shapeselectiondialog-is-invisible"
                    v-t="'game.ui.selection.edit_dialog.dialog.is_invisible'"
                ></label>
                <input
                    type="checkbox"
                    id="shapeselectiondialog-is-invisible"
                    :checked="shape.isInvisible"
                    @click="setInvisible"
                    style="grid-column-start: remove;"
                    class="styled-checkbox"
                    :disabled="!owned"
                />
                <label
                    for="shapeselectiondialog-is-locked"
                    v-t="'game.ui.selection.edit_dialog.dialog.is_locked'"
                ></label>
                <input
                    type="checkbox"
                    id="shapeselectiondialog-is-locked"
                    :checked="shape.isLocked"
                    @click="setLocked"
                    style="grid-column-start: remove;"
                    class="styled-checkbox"
                    :disabled="!owned"
                />
                <label
                    for="shapeselectiondialog-showBadge"
                    v-t="'game.ui.selection.edit_dialog.dialog.show_badge'"
                ></label>
                <input
                    type="checkbox"
                    id="shapeselectiondialog-showBadge"
                    :checked="shape.showBadge"
                    @click="toggleBadge"
                    style="grid-column-start: remove;"
                    class="styled-checkbox"
                    :disabled="!owned"
                />
                <label
                    for="shapeselectiondialog-visionblocker"
                    v-t="'game.ui.selection.edit_dialog.dialog.block_vision_light'"
                ></label>
                <input
                    type="checkbox"
                    id="shapeselectiondialog-visionblocker"
                    v-model="shape.visionObstruction"
                    @change="setVisionBlocker"
                    style="grid-column-start: remove;"
                    :disabled="!owned"
                />
                <label
                    for="shapeselectiondialog-moveblocker"
                    v-t="'game.ui.selection.edit_dialog.dialog.block_movement'"
                ></label>
                <input
                    type="checkbox"
                    id="shapeselectiondialog-moveblocker"
                    :checked="shape.movementObstruction"
                    @click="setMovementBlocker"
                    style="grid-column-start: remove;"
                    :disabled="!owned"
                />
                <label for="shapeselectiondialog-strokecolour" v-t="'common.border_color'"></label>
                <color-picker
                    :color="shape.strokeColour"
                    @input="setStrokeColour($event, true)"
                    @change="setStrokeColour($event)"
                    style="grid-column-start: remove;"
                    :disabled="!owned"
                />
                <label for="shapeselectiondialog-fillcolour" v-t="'common.fill_color'"></label>
                <color-picker
                    :color="shape.fillColour"
                    @input="setFillColour($event, true)"
                    @change="setFillColour($event)"
                    style="grid-column-start: remove;"
                    :disabled="!owned"
                />
                <EditDialogAccess :shape="shape" :owned="owned" />
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
                <div class="spanrow header" v-t="'common.labels'"></div>
                <div id="labels" class="spanrow">
                    <div v-for="label in shape.labels" class="label" :key="label.uuid">
                        <template v-if="label.category">
                            <div class="label-user">{{ label.category }}</div>
                            <div class="label-main" @click="removeLabel(label.uuid)">{{ label.name }}</div>
                        </template>
                        <template v-if="!label.category">
                            <div class="label-main" @click="removeLabel(label.uuid)">{{ label.name }}</div>
                        </template>
                    </div>
                    <div class="label" id="label-add" v-if="owned">
                        <div class="label-main" @click="openLabelManager">+</div>
                    </div>
                </div>
                <div class="spanrow header" v-t="'common.annotation'"></div>
                <textarea
                    class="spanrow"
                    :value="shape.annotation"
                    @change="updateAnnotation"
                    :disabled="!owned"
                ></textarea>
            </div>
        </div>
    </Modal>
</template>

<style scoped>
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.header-close {
    position: absolute;
    top: 5px;
    right: 5px;
}

.modal-body {
    padding: 10px;
    max-width: 450px;
}

.grid {
    display: grid;
    grid-template-columns: [name] 1fr [numerator] 30px [slash] 5px [denominator] 30px [colour] 40px [visible] 30px [light] 30px [remove] 30px [end];
    grid-column-gap: 5px;
    align-items: center;
}

.colours {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

::v-deep .header {
    line-height: 0.1em;
    margin: 20px 0 15px;
}

::v-deep .header:after {
    position: absolute;
    right: 5px;
    width: 75%;
    border-bottom: 1px solid #000;
    content: "";
}

::v-deep .spanrow {
    grid-column: 1 / end;
}

.label {
    display: inline-flex;
    position: relative;
    flex-direction: row;
    align-items: center;
    background-color: white;
    font-size: 13px;
    margin: 5px;
}

.label:hover > .label-main::before {
    content: "\00D7";
    position: absolute;
    color: red;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    top: -8px;
    right: -4px;
    pointer-events: auto;
}

#label-add:hover > .label-main {
    pointer-events: auto;
    cursor: pointer;
    color: white;
    font-weight: bold;
    background-color: #ff7052;
}

#label-add:hover > .label-main::before {
    content: "";
}

.label-user {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    background-color: #ff7052;
    border: solid 1px #ff7052;
    padding: 5px;
}

.label-main {
    border: solid 1px #ff7052;
    border-radius: 10px;
    padding: 5px;
    pointer-events: none;
}

.label-user + .label-main {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

input[type="checkbox"] {
    width: 16px;
    height: 23px;
    margin: 0 8px 0 8px;
    white-space: nowrap;
    display: inline-block;
}

input[type="text"] {
    padding: 2px;
}
</style>
