<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import ColorPicker from "@/core/components/colorpicker.vue";

import { SyncTo } from "../../../../core/models/types";
import { ActiveShapeState, activeShapeStore } from "../../ActiveShapeStore";

@Component({ components: { ColorPicker } })
export default class PropertySettings extends Vue {
    get owned(): boolean {
        return activeShapeStore.hasEditAccess;
    }

    get shape(): ActiveShapeState {
        return activeShapeStore;
    }

    updateName(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setName({ name: event.target.value, syncTo: SyncTo.SERVER });
    }

    toggleNameVisible(): void {
        if (!this.owned) return;
        this.shape.setNameVisible({ visible: !this.shape.nameVisible, syncTo: SyncTo.SERVER });
    }

    setToken(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setIsToken({ isToken: event.target.checked, syncTo: SyncTo.SERVER });
    }

    setInvisible(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setIsInvisible({ isInvisible: event.target.checked, syncTo: SyncTo.SERVER });
    }

    setDefeated(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setIsDefeated({ isDefeated: event.target.checked, syncTo: SyncTo.SERVER });
    }

    setLocked(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setLocked({ isLocked: event.target.checked, syncTo: SyncTo.SERVER });
    }

    toggleBadge(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setShowBadge({ showBadge: event.target.checked, syncTo: SyncTo.SERVER });
    }

    setVisionBlocker(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setVisionObstruction({ blocksVision: event.target.checked, syncTo: SyncTo.SERVER });
    }

    setMovementBlocker(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setMovementObstruction({ blocksMovement: event.target.checked, syncTo: SyncTo.SERVER });
    }

    setStrokeColour(event: string, temporary = false): void {
        if (!this.owned) return;
        this.shape.setStrokeColour({ colour: event, syncTo: temporary ? SyncTo.SHAPE : SyncTo.SERVER });
    }

    setFillColour(event: string, temporary = false): void {
        if (!this.owned) return;
        this.shape.setFillColour({ colour: event, syncTo: temporary ? SyncTo.SHAPE : SyncTo.SERVER });
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Common</div>
        <div class="row">
            <label for="shapeselectiondialog-name" v-t="'common.name'"></label>
            <input
                type="text"
                id="shapeselectiondialog-name"
                :value="shape.name"
                @change="updateName"
                :disabled="!owned"
            />
            <div
                :style="{ opacity: shape.nameVisible ? 1.0 : 0.3, textAlign: 'center' }"
                @click="toggleNameVisible"
                :disabled="!owned"
                :title="$t('common.toggle_public_private')"
            >
                <font-awesome-icon icon="eye" />
            </div>
        </div>
        <div class="row">
            <label for="shapeselectiondialog-istoken" v-t="'game.ui.selection.edit_dialog.dialog.is_a_token'"></label>
            <input
                type="checkbox"
                id="shapeselectiondialog-istoken"
                :checked="shape.isToken"
                @click="setToken"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label
                for="shapeselectiondialog-is-invisible"
                v-t="'game.ui.selection.edit_dialog.dialog.is_invisible'"
            ></label>
            <input
                type="checkbox"
                id="shapeselectiondialog-is-invisible"
                :checked="shape.isInvisible"
                @click="setInvisible"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label
                for="shapeselectiondialog-is-defeated"
                v-t="'game.ui.selection.edit_dialog.dialog.is_defeated'"
            ></label>
            <input
                type="checkbox"
                id="shapeselectiondialog-is-defeated"
                :checked="shape.isDefeated"
                @click="setDefeated"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-strokecolour" v-t="'common.border_color'"></label>
            <ColorPicker
                :color="shape.strokeColour"
                @input="setStrokeColour($event, true)"
                @change="setStrokeColour($event)"
                style="grid-column-start: toggle"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-fillcolour" v-t="'common.fill_color'"></label>
            <ColorPicker
                :color="shape.fillColour"
                @input="setFillColour($event, true)"
                @change="setFillColour($event)"
                style="grid-column-start: toggle"
                :disabled="!owned"
            />
        </div>
        <div class="spanrow header">Advanced</div>
        <div class="row">
            <label
                for="shapeselectiondialog-visionblocker"
                v-t="'game.ui.selection.edit_dialog.dialog.block_vision_light'"
            ></label>
            <input
                type="checkbox"
                id="shapeselectiondialog-visionblocker"
                :checked="shape.visionObstruction"
                @click="setVisionBlocker"
                style="grid-column-start: toggle"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label
                for="shapeselectiondialog-moveblocker"
                v-t="'game.ui.selection.edit_dialog.dialog.block_movement'"
            ></label>
            <input
                type="checkbox"
                id="shapeselectiondialog-moveblocker"
                :checked="shape.movementObstruction"
                @click="setMovementBlocker"
                style="grid-column-start: toggle"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-is-locked" v-t="'game.ui.selection.edit_dialog.dialog.is_locked'"></label>
            <input
                type="checkbox"
                id="shapeselectiondialog-is-locked"
                :checked="shape.isLocked"
                @click="setLocked"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-showBadge" v-t="'game.ui.selection.edit_dialog.dialog.show_badge'"></label>
            <input
                type="checkbox"
                id="shapeselectiondialog-showBadge"
                :checked="shape.showBadge"
                @click="toggleBadge"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
            />
        </div>
    </div>
</template>

<style scoped>
.panel {
    grid-template-columns: [label] 1fr [name] 2fr [toggle] 30px [end];
    grid-column-gap: 5px;
    align-items: center;
    padding-bottom: 1em;
    justify-items: center;
}

label {
    justify-self: normal;
}

/* Reset PanelModal 100% style */
input[type="text"] {
    width: auto;
}

input[type="checkbox"] {
    width: 16px;
    height: 23px;
    margin: 0 8px 0 8px;
    white-space: nowrap;
    display: inline-block;
}
</style>
