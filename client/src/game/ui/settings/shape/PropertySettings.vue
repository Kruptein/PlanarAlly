<script lang="ts">
import { defineComponent, toRefs } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../../core/components/ColourPicker.vue";
import { SyncTo } from "../../../../core/models/types";
import { activeShapeStore } from "../../../../store/activeShape";

export default defineComponent({
    components: { ColourPicker },
    setup() {
        const { t } = useI18n();

        const owned = activeShapeStore.hasEditAccess.value;

        function updateName(event: { target: HTMLInputElement }): void {
            if (!owned) return;
            activeShapeStore.setName(event.target.value, SyncTo.SERVER);
        }

        function toggleNameVisible(): void {
            if (!owned) return;
            activeShapeStore.setNameVisible(!activeShapeStore.state.nameVisible, SyncTo.SERVER);
        }

        function setToken(event: { target: HTMLInputElement }): void {
            if (!owned) return;
            activeShapeStore.setIsToken(event.target.checked, SyncTo.SERVER);
        }

        function setInvisible(event: { target: HTMLInputElement }): void {
            if (!owned) return;
            activeShapeStore.setIsInvisible(event.target.checked, SyncTo.SERVER);
        }

        function setDefeated(event: { target: HTMLInputElement }): void {
            if (!owned) return;
            activeShapeStore.setIsDefeated(event.target.checked, SyncTo.SERVER);
        }

        function setLocked(event: { target: HTMLInputElement }): void {
            if (!owned) return;
            activeShapeStore.setLocked(event.target.checked, SyncTo.SERVER);
        }

        function toggleBadge(event: { target: HTMLInputElement }): void {
            if (!owned) return;
            activeShapeStore.setShowBadge(event.target.checked, SyncTo.SERVER);
        }

        function setBlocksVision(event: { target: HTMLInputElement }): void {
            if (!owned) return;
            activeShapeStore.setBlocksVision(event.target.checked, SyncTo.SERVER);
        }

        function setBlocksMovement(event: { target: HTMLInputElement }): void {
            if (!owned) return;
            activeShapeStore.setBlocksMovement(event.target.checked, SyncTo.SERVER);
        }

        function setStrokeColour(event: string, temporary = false): void {
            if (!owned) return;
            activeShapeStore.setStrokeColour(event, temporary ? SyncTo.SHAPE : SyncTo.SERVER);
        }

        function setFillColour(event: string, temporary = false): void {
            if (!owned) return;
            activeShapeStore.setFillColour(event, temporary ? SyncTo.SHAPE : SyncTo.SERVER);
        }

        return {
            ...toRefs(activeShapeStore.state),
            owned: activeShapeStore.hasEditAccess,
            setBlocksMovement,
            setBlocksVision,
            setDefeated,
            setFillColour,
            setInvisible,
            setLocked,
            setStrokeColour,
            setToken,
            t,
            toggleBadge,
            toggleNameVisible,
            updateName,
        };
    },
});
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Common</div>
        <div class="row">
            <label for="shapeselectiondialog-name" v-t="'common.name'"></label>
            <input type="text" id="shapeselectiondialog-name" :value="name" @change="updateName" :disabled="!owned" />
            <div
                :style="{ opacity: nameVisible ? 1.0 : 0.3, textAlign: 'center' }"
                @click="toggleNameVisible"
                :disabled="!owned"
                :title="t('common.toggle_public_private')"
            >
                <font-awesome-icon icon="eye" />
            </div>
        </div>
        <div class="row">
            <label for="shapeselectiondialog-istoken" v-t="'game.ui.selection.edit_dialog.dialog.is_a_token'"></label>
            <input
                type="checkbox"
                id="shapeselectiondialog-istoken"
                :checked="isToken"
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
                :checked="isInvisible"
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
                :checked="isDefeated"
                @click="setDefeated"
                style="grid-column-start: toggle"
                class="styled-checkbox"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-strokecolour" v-t="'common.border_color'"></label>
            <ColourPicker
                :color="strokeColour"
                @input="setStrokeColour($event, true)"
                @change="setStrokeColour($event)"
                style="grid-column-start: toggle"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-fillcolour" v-t="'common.fill_color'"></label>
            <ColourPicker
                :color="fillColour"
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
                :checked="blocksVision"
                @click="setBlocksVision"
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
                :checked="blocksMovement"
                @click="setBlocksMovement"
                style="grid-column-start: toggle"
                :disabled="!owned"
            />
        </div>
        <div class="row">
            <label for="shapeselectiondialog-is-locked" v-t="'game.ui.selection.edit_dialog.dialog.is_locked'"></label>
            <input
                type="checkbox"
                id="shapeselectiondialog-is-locked"
                :checked="isLocked"
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
                :checked="showBadge"
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
