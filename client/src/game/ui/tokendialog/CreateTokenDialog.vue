<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../core/components/ColourPicker.vue";
import Modal from "../../../core/components/modals/Modal.vue";
import { getUnitDistance, l2g } from "../../../core/conversions";
import { toLP } from "../../../core/geometry";
import { InvalidationMode, SyncMode, UI_SYNC } from "../../../core/models/types";
import { calcFontScale, mostReadable } from "../../../core/utils";
import { clientStore } from "../../../store/client";
import { floorStore } from "../../../store/floor";
import { settingsStore } from "../../../store/settings";
import { CircularToken } from "../../shapes/variants/circularToken";
import { accessSystem } from "../../systems/access";

import { tokenDialogLeft, tokenDialogTop, tokenDialogVisible } from "./state";

const visible = tokenDialogVisible;

const { t } = useI18n();
const canvas = ref<HTMLCanvasElement | null>(null);
const name = ref<HTMLInputElement | null>(null);

const borderColour = ref("rgba(0, 0, 0, 1)");
const fillColour = ref("rgba(255, 255, 255, 1)");
const text = ref("");

// can't use watchEffect here, because the name focus change will trigger this
// on colour picker select
watch(tokenDialogVisible, (isVisible) => {
    if (isVisible) {
        updatePreview();
        nextTick(() => name.value?.focus());
    }
});
watch(borderColour, updatePreview);
watch(fillColour, updatePreview);
watch(text, updatePreview);

function close(): void {
    tokenDialogVisible.value = false;
}

function submit(): void {
    const layer = floorStore.currentLayer.value!;

    const token = new CircularToken(
        l2g(toLP(tokenDialogLeft, tokenDialogTop)),
        getUnitDistance(settingsStore.unitSize.value / 2),
        text.value || "X",
        "10px serif",
        { fillColour: fillColour.value, strokeColour: [borderColour.value] },
    );
    accessSystem.addAccess(token.id, clientStore.state.username, { edit: true, movement: true, vision: true }, UI_SYNC);
    layer.addShape(token, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);
    close();
}

function updatePreview(): void {
    if (canvas.value === null) return;

    canvas.value.width = 100;
    canvas.value.height = 100;
    const ctx = canvas.value.getContext("2d")!;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    const dest = { x: ctx.canvas.width / 2, y: ctx.canvas.height / 2 };
    const r = Math.min(dest.x, dest.y) * 0.9;
    ctx.fillStyle = fillColour.value;
    ctx.arc(dest.x, dest.y, r, 0, 2 * Math.PI);
    ctx.fill();
    if (borderColour.value !== "rgba(0, 0, 0, 0)") {
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.strokeStyle = borderColour.value;
        ctx.arc(dest.x, dest.y, r - 2.5, 0, 2 * Math.PI);
        ctx.stroke();
    }
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fontScale = calcFontScale(ctx, text.value || "X", r - 2.5);
    ctx.setTransform(fontScale, 0, 0, fontScale, dest.x, dest.y);
    ctx.fillStyle = mostReadable(fillColour.value);
    ctx.fillText(text.value || "X", 0, 0);
    ctx.restore();
}
</script>

<template>
    <Modal :visible="visible" @close="close">
        <template v-slot:header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                {{ t("game.ui.tools.CreateTokenModal.create_basic_token") }}
            </div>
        </template>
        <div class="modal-body">
            <label for="createtokendialog-text">{{ t("game.ui.tools.CreateTokenModal.text") }}</label>
            <input
                type="text"
                id="createtokendialog-name"
                v-model="text"
                ref="name"
                placeholder="X"
                @keyup.enter="submit"
            />
            <label>{{ t("common.colours") }}</label>
            <div class="colours">
                <span>{{ t("game.ui.tools.CreateTokenModal.fill") }}</span>
                <ColourPicker v-model:colour="fillColour" />
                <span>{{ t("game.ui.tools.CreateTokenModal.border") }}</span>
                <ColourPicker v-model:colour="borderColour" />
            </div>
            <canvas ref="canvas"></canvas>
        </div>
        <div class="modal-footer">
            <button @click="submit">{{ t("common.submit") }}</button>
        </div>
    </Modal>
</template>

<style scoped>
canvas {
    grid-column: label / end;
    justify-self: center;
}

.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.modal-body {
    padding: 10px;
    display: grid;
    grid-template-columns: [label] 1fr [value] 2fr [end];
    grid-row-gap: 10px;
    align-items: center;
}

.modal-footer {
    padding: 10px;
    text-align: right;
}

.colours {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
</style>
