<template>
    <modal :visible="visible" @close="visible = false">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            Create basic token
        </div>
        <div class="modal-body">
            <label for="createtokendialog-text">Text</label>
            <input type="text" id="createtokendialog-name" v-model="text" />
            <label>Colours</label>
            <div class="colours">
                <span>Fill:</span>
                <color-picker :color.sync="fillColour" />
                <span>Border:</span>
                <color-picker :color.sync="borderColour" />
            </div>
            <canvas ref="canvas" width="100px" height="100px"></canvas>
        </div>
        <div class="modal-footer">
            <button @click="submit">Submit</button>
        </div>
    </modal>
</template>

<script lang="ts">
import * as tinycolor from "tinycolor2";
import Vue from "vue";
import Component from "vue-class-component";

import { mapState } from "vuex";

import ColorPicker from "@/core/components/colorpicker.vue";
import Modal from "@/core/components/modals/modal.vue";

import { calcFontScale } from "@/core/utils";
import { LocalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { CircularToken } from "@/game/shapes/circulartoken";
import { gameStore } from "@/game/store";
import { getUnitDistance, l2g } from "@/game/units";
import { Watch } from "vue-property-decorator";
import { SyncMode, InvalidationMode } from "../../../core/comm/types";

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
    x = 0;
    y = 0;
    visible = false;
    text = "X";
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

    open(x: number, y: number): void {
        this.visible = true;
        this.x = x;
        this.y = y;
    }
    submit(): void {
        const layer = layerManager.getLayer(layerManager.floor!.name);
        if (layer === undefined) return;
        const token = new CircularToken(
            l2g(new LocalPoint(this.x, this.y)),
            getUnitDistance(gameStore.unitSize / 2),
            this.text,
            "10px serif",
            this.fillColour,
            this.borderColour,
        );
        token.addOwner(gameStore.username);
        layer.addShape(token, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);
        layer.invalidate(false);
        this.visible = false;
    }
    updatePreview(): void {
        const ctx = (<HTMLCanvasElement>this.$refs.canvas).getContext("2d")!;
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
        const fontScale = calcFontScale(ctx, this.text, r - 2.5);
        ctx.setTransform(fontScale, 0, 0, fontScale, dest.x, dest.y);
        ctx.fillStyle = tinycolor.mostReadable(this.fillColour, ["#000", "#fff"]).toHexString();
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}
</script>

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
    padding-top: 0;
    padding: 10px;
    text-align: right;
}

.colours {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
</style>
