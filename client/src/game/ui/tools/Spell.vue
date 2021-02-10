<script lang="ts">
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";

import ColorPicker from "@/core/components/colorpicker.vue";

import { InvalidationMode, SyncMode, SyncTo } from "../../../core/models/types";
import { baseAdjust } from "../../../core/utils";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { GlobalPoint, LocalPoint } from "../../geom";
import { Floor } from "../../layers/floor";
import { Layer } from "../../layers/layer";
import { layerManager } from "../../layers/manager";
import { floorStore } from "../../layers/store";
import { Shape } from "../../shapes/shape";
import { Circle } from "../../shapes/variants/circle";
import { Rect } from "../../shapes/variants/rect";
import { gameStore } from "../../store";
import { g2l, getUnitDistance, l2g, toRadians } from "../../units";

import Tool from "./tool.vue";
import { ToolBasics } from "./ToolBasics";
import Tools from "./tools.vue";
import { ToolName } from "./utils";

type ShapeChoice = "square" | "circle" | "cone";

@Component({
    components: {
        "color-picker": ColorPicker,
    },
})
export default class SpellTool extends Tool implements ToolBasics {
    $parent!: Tools;

    name = ToolName.Spell;

    shapeSelect: ShapeChoice = "square";
    shapes: ShapeChoice[] = ["square", "circle", "cone"];
    shape: Shape | undefined = undefined;

    size = 5;
    colour = "rgb(63, 127, 191)";
    showPublic = true;
    range = 0;
    rangeShape: Circle | undefined = undefined;

    @Watch("size")
    onSizeChange(): void {
        if (this.size <= 0) this.size = 1;
        if (this.shape !== undefined) this.drawShape(this.shapeSelect);
    }

    @Watch("range")
    onRangeChange(): void {
        if (this.range < 0) this.range = 0;
        if (this.range > 0 && this.shapeSelect === "cone") {
            this.shapeSelect = "circle";
        }
        if (this.shape !== undefined) this.drawShape(this.shapeSelect);
        else if (this.rangeShape !== undefined) this.drawRangeShape();
    }

    @Watch("colour")
    onColourChange(): void {
        if (this.shape !== undefined) this.drawShape(this.shapeSelect);
    }

    @Watch("showPublic")
    onShowPublicChange(): void {
        if (this.shape !== undefined) this.drawShape(this.shapeSelect, true);
    }

    onSelect(): void {
        const selected = this.getSelectedShape();
        if (selected === undefined && this.shapeSelect === "cone") {
            this.shapeSelect = "circle";
        }
        this.drawShape(this.shapeSelect);
    }

    onDeselect(data?: { floor?: Floor; layer?: string }): void {
        const layer = this.getLayer(data);
        if (layer === undefined) return;
        if (this.shape !== undefined) {
            layer.removeShape(this.shape, this.showPublic ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC, false);
            this.shape = undefined;
        }
        if (this.rangeShape !== undefined) {
            layer.removeShape(this.rangeShape, this.showPublic ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC, false);
            this.rangeShape = undefined;
        }
    }

    onDown(): void {
        if (this.shape === undefined) return;
        const layer = this.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        layer.removeShape(this.shape, this.showPublic ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC, false);
        this.shape.isInvisible = !this.showPublic;
        layer.addShape(this.shape, SyncMode.FULL_SYNC, InvalidationMode.NORMAL, false);
        this.shape = undefined;
        this.$parent.currentTool = ToolName.Select;
    }

    onContextMenu(): void {
        if (this.shape !== undefined) {
            const layer = this.getLayer();
            if (layer === undefined) {
                console.log("No active layer!");
                return;
            }

            layer.removeShape(this.shape, this.showPublic ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC, false);
            this.shape = undefined;
        }
        this.$parent.currentTool = ToolName.Select;
    }

    onMove(lp: LocalPoint): void {
        const selected = this.getSelectedShape();
        if (this.shape === undefined) return;

        let endPoint = l2g(lp);
        const layer = this.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        if (selected !== undefined && this.range === 0) {
            if (this.shapeSelect === "cone") {
                const center = g2l(this.shape.center());
                (this.shape as Circle).angle = -Math.atan2(lp.y - center.y, center.x - lp.x) + Math.PI;
                if (this.showPublic) sendShapePositionUpdate([this.shape], true);
                layer.invalidate(true);
            }
        } else {
            this.shape.center(endPoint);
            if (this.showPublic) sendShapePositionUpdate([this.shape], true);
            layer.invalidate(true);
        }
    }

    getShapeWord(shape: string): string {
        switch (shape) {
            case "square":
                return this.$t("draw.square").toString();

            case "circle":
                return this.$t("draw.circle").toString();

            case "cone":
                return this.$t("draw.cone").toString();

            default:
                return "";
        }
    }

    drawShape(shape: ShapeChoice, syncChanged = false): void {
        const selected = this.getSelectedShape();
        if (selected === undefined && shape === "cone") return;

        this.shapeSelect = shape;

        const layer = this.getLayer();
        if (layer === undefined) return;

        const ogPoint = new GlobalPoint(0, 0);
        let startPosition = ogPoint;

        if (this.shape !== undefined) {
            startPosition = this.shape.refPoint;
            let syncMode = this.showPublic !== syncChanged ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC;
            layer.removeShape(this.shape, syncMode, false);
        }

        switch (this.shapeSelect) {
            case "circle":
                this.shape = new Circle(startPosition, getUnitDistance(this.size));
                break;
            case "square":
                this.shape = new Rect(startPosition, getUnitDistance(this.size), getUnitDistance(this.size));
                break;
            case "cone":
                this.shape = new Circle(startPosition, getUnitDistance(this.size), { viewingAngle: toRadians(60) });
                break;
        }

        if (this.shape === undefined) return;

        this.shape.fillColour = this.colour.replace(")", ", 0.7)");
        this.shape.strokeColour = this.colour;
        this.shape.addOwner({ user: gameStore.username, access: { edit: true } }, SyncTo.UI);

        if (selected !== undefined && (this.range === 0 || startPosition.equals(ogPoint)))
            this.shape.center(selected.center());

        layer.addShape(
            this.shape,
            this.showPublic ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC,
            InvalidationMode.NORMAL,
            false,
        );

        this.drawRangeShape();
    }

    drawRangeShape(): void {
        const layer = this.getLayer();
        if (layer === undefined) return;

        if (this.rangeShape !== undefined) {
            layer.removeShape(this.rangeShape, SyncMode.NO_SYNC, false);
        }

        const selected = this.getSelectedShape();
        if (selected === undefined || this.range === 0) return;

        this.rangeShape = new Circle(selected.center(), getUnitDistance(this.range), {
            fillColour: "rgba(0,0,0,0)",
            strokeColour: "black",
        });
        layer.addShape(this.rangeShape, SyncMode.NO_SYNC, InvalidationMode.NORMAL, false);
    }

    getLayer(data?: { floor?: Floor; layer?: string }): Layer | undefined {
        return layerManager.getLayer(data?.floor ?? floorStore.currentFloor, data?.layer);
    }

    getSelectedShape(): Shape | undefined {
        return this.getLayer()?.getSelection({ includeComposites: false })[0];
    }

    canConeBeCast(): boolean {
        return this.getSelectedShape() !== undefined && this.range === 0;
    }

    getConeImage(): string {
        return baseAdjust("static/img/cone.svg");
    }
}
</script>

<template>
    <div class="tool-detail" v-if="selected" :style="{ '--detailRight': detailRight(), '--detailArrow': detailArrow }">
        <div class="selectgroup">
            <div
                v-for="shape in shapes"
                :key="shape"
                class="option"
                :class="{
                    'option-selected': shapeSelect === shape,
                    disabled: !canConeBeCast() && shape === 'cone',
                }"
                @click="drawShape(shape)"
                :title="getShapeWord(shape)"
            >
                <font-awesome-icon v-if="shape !== 'cone'" :icon="shape" />
                <img v-else :src="getConeImage()" />
            </div>
        </div>
        <div id="grid">
            <label for="size" style="flex: 5" v-t="'game.ui.tools.spell.size'"></label>
            <input type="number" id="size" style="flex: 1; align-self: center" v-model.number="size" min="0" step="5" />
            <label
                for="range"
                style="flex: 5"
                v-t="'game.ui.tools.spell.range'"
                :class="{ disabled: getSelectedShape() === undefined }"
            ></label>
            <input
                type="number"
                id="range"
                style="flex: 1; align-self: center"
                min="0"
                step="5"
                v-model.number="range"
                :disabled="getSelectedShape() === undefined"
                :class="{ disabled: getSelectedShape() === undefined }"
            />
            <label for="colour" style="flex: 5" v-t="'common.fill_color'"></label>
            <color-picker class="option" :color.sync="colour" :title="$t('game.ui.tools.draw.background_color')" />
            <label for="range" style="flex: 5" v-t="'game.ui.selection.edit_dialog.dialog.show_annotation'"></label>
            <button class="slider-checkbox" :aria-pressed="showPublic" @click="showPublic = !showPublic"></button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.option {
    padding: 6px;
    border: solid 1px #82c8a0;
    border-radius: 0;
    flex: 1 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 13px;
    min-width: 25px;

    img {
        width: 1.25em;
    }
}

.option-selected,
.option:hover {
    background-color: #82c8a0;
    cursor: pointer;
}

.selectgroup {
    display: flex;
    margin-bottom: 10px;

    > .option:first-of-type {
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
    }

    > .option:last-of-type {
        border-top-right-radius: 10px;
        border-bottom-right-radius: 10px;
    }
}

#grid {
    display: grid;
    grid-template-columns: 1fr 0.5fr;
    row-gap: 5px;
    align-items: center;
}

.disabled {
    /* the cone svg is not inlined so just setting color does not work */
    filter: invert(52%) sepia(18%) saturate(268%) hue-rotate(173deg) brightness(92%) contrast(87%);
    cursor: not-allowed;

    &:hover,
    &:hover * {
        cursor: not-allowed;
        background-color: inherit;
    }
}
</style>
