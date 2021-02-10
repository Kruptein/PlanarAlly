<script lang="ts">
import * as tinycolor from "tinycolor2";
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";
import { mapState } from "vuex";

import ColorPicker from "@/core/components/colorpicker.vue";
import Modal from "@/core/components/modals/modal.vue";
import { calcFontScale } from "@/core/utils";
import { LocalPoint } from "@/game/geom";
import { floorStore } from "@/game/layers/store";
import { CircularToken } from "@/game/shapes/variants/circulartoken";
import { gameStore } from "@/game/store";
import { getUnitDistance, l2g } from "@/game/units";

import { SyncMode, InvalidationMode, SyncTo } from "../../../core/models/types";
import { gameSettingsStore } from "../../settings";

@Component({
    components: {
        Modal,
        "color-picker": ColorPicker,
    },
    computed: {
        ...mapState("game", ["unitSize"]),
    },
})
export default class CreateTokenModal extends Vue {
    $refs!: {
        canvas: HTMLCanvasElement;
        name: HTMLInputElement;
    };
    x = 0;
    y = 0;
    visible = false;
    text = "";
    fillColour = "rgba(255, 255, 255, 1)";
    borderColour = "rgba(0, 0, 0, 1)";

    mounted(): void {
        this.updatePreview();
    }

    @Watch("text")
    onTextChange(_newValue: string, _oldValue: string): void {
        this.updatePreview();
    }
    @Watch("fillColour")
    onFillChange(_newValue: string, _oldValue: string): void {
        this.updatePreview();
    }
    @Watch("borderColour")
    onBorderChange(_newValue: string, _oldValue: string): void {
        this.updatePreview();
    }

    close(): void {
        this.visible = false;
        this.$emit("close");
    }

    open(x: number, y: number): void {
        this.visible = true;
        this.x = x;
        this.y = y;

        this.$nextTick(() => {
            this.$refs.name.focus();
        });
    }
    submit(): void {
        const layer = floorStore.currentLayer;
        if (layer === undefined) return;
        const token = new CircularToken(
            l2g(new LocalPoint(this.x, this.y)),
            getUnitDistance(gameSettingsStore.unitSize / 2),
            this.text || "X",
            "10px serif",
            { fillColour: this.fillColour, strokeColour: this.borderColour },
        );
        token.addOwner({ user: gameStore.username, access: { edit: true } }, SyncTo.UI);
        layer.addShape(token, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);
        this.close();
    }
    updatePreview(): void {
        const ctx = this.$refs.canvas.getContext("2d")!;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.beginPath();
        const dest = { x: ctx.canvas.width / 2, y: ctx.canvas.height / 2 };
        const r = Math.min(dest.x, dest.y) * 0.9;

        ctx.fillStyle = this.fillColour;

        ctx.arc(dest.x, dest.y, r, 0, 2 * Math.PI);
        ctx.fill();
        if (this.borderColour !== "rgba(0, 0, 0, 0)") {
            ctx.beginPath();
            ctx.lineWidth = 5;
            ctx.strokeStyle = this.borderColour;
            ctx.arc(dest.x, dest.y, r - 2.5, 0, 2 * Math.PI);
            ctx.stroke();
        }
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const fontScale = calcFontScale(ctx, this.text || "X", r - 2.5);
        ctx.setTransform(fontScale, 0, 0, fontScale, dest.x, dest.y);
        ctx.fillStyle = tinycolor.mostReadable(this.fillColour, ["#000", "#fff"]).toHexString();
        ctx.fillText(this.text || "X", 0, 0);
        ctx.restore();
    }
}
</script>

<template>
    <modal :visible="visible" @close="close">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
            v-t="'game.ui.tools.createtoken_modal.create_basic_token'"
        ></div>
        <div class="modal-body">
            <label for="createtokendialog-text" v-t="'game.ui.tools.createtoken_modal.text'"></label>
            <input
                type="text"
                id="createtokendialog-name"
                v-model="text"
                ref="name"
                placeholder="X"
                @keyup.enter="submit"
            />
            <label v-t="'common.colours'"></label>
            <div class="colours">
                <span v-t="'game.ui.tools.createtoken_modal.fill'"></span>
                <color-picker :color.sync="fillColour" />
                <span v-t="'game.ui.tools.createtoken_modal.border'"></span>
                <color-picker :color.sync="borderColour" />
            </div>
            <canvas ref="canvas" width="100px" height="100px"></canvas>
        </div>
        <div class="modal-footer">
            <button @click="submit" v-t="'common.submit'"></button>
        </div>
    </modal>
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
