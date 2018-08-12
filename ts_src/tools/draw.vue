<template>
    <div class='tool-detail' v-if="selected" :style="{'--detailRight': detailRight, '--detailArrow': detailArrow}">
        <div>Colours</div>
        <div class='selectgroup'>
            <color-picker class='option' :color.sync="fillColour" />
            <color-picker class='option' :color.sync="borderColour" />
        </div>
        <div>Shape</div>
        <div class='selectgroup'>
            <div
                v-for="shape in shapes"
                :key="shape"
                class='option'
                :class="{'option-selected': shapeSelect === shape}"
                @click="shapeSelect = shape"
            >
                <i class="fas" :class="'fa-' + shape"></i>
            </div>
        </div>
        <div v-show='shapeSelect === "paint-brush"'>Brush size</div>
        <input type='text' v-model='brushSize' v-show='shapeSelect === "paint-brush"' style='max-width:100px;'>
    </div>
</template>

<script lang="ts">
import Tool from "./tool.vue";

import gameManager from "../planarally";
import { getMouse } from "../utils";
import { l2g, getUnitDistance } from "../units";
import { GlobalPoint } from "../geom";
import colorpicker from "../../vue/components/colorpicker.vue";
import Rect from "../shapes/rect";
import Circle from "../shapes/circle";
import Settings from "../settings";
import Shape from "../shapes/shape";
import { socket } from "../socket";
import MultiLine from "../shapes/multiline";


export default Tool.extend({
    components: {
        'color-picker': colorpicker
    },
    data() {
        return {
            name: "draw",
            active: false,
            
            startPoint: <GlobalPoint|null> null,
            shape: <Shape|null> null,
            brushHelper: <Circle|null> null,

            fillColour: {rgba: {r: 0, g: 0, b: 0, a: 1}},
            borderColour: {rgba: {r: 255, g: 255, b: 255, a: 1}},
            shapeSelect: "square",
            shapes: ['square', 'circle', 'paint-brush'],
            brushSize: 10,
        }
    },
    computed: {
        fillRgb(): string {
            return tinycolor(this.fillColour.rgba).toRgbString();
        },
        borderRgb(): string {
            return tinycolor(this.borderColour.rgba).toRgbString();
        },
        helperSize(): number {
            if (this.shapeSelect === 'paint-brush')
                return this.brushSize / 2;
            return 3;
        }
    },
    watch: {
        fillColour() {
            if (this.brushHelper)
                this.brushHelper.fill = this.fillRgb;
        }
    },
    methods: {
        onMouseDown(event: MouseEvent) {
            const layer = gameManager.layerManager.getLayer();
            if (layer === undefined) {
                console.log("No active layer!");
                return;
            }
            this.active = true;
            this.startPoint = l2g(getMouse(event));
            if (this.shapeSelect === 'square')
                this.shape = new Rect(this.startPoint.clone(), 0, 0, this.fillRgb, this.borderRgb);
            else if (this.shapeSelect === 'circle')
                this.shape = new Circle(this.startPoint.clone(), 0, this.fillRgb, this.borderRgb);
            else if (this.shapeSelect === 'paint-brush') {
                this.shape = new MultiLine(this.startPoint.clone(), [], this.brushSize);
                this.shape.fill = this.fillRgb;
            } else return;

            // this.shape.options.set("preFogShape", true)

            this.shape.owners.push(Settings.username);
            if (layer.name === 'fow') {
                this.shape.visionObstruction = true;
                this.shape.movementObstruction = true;
            }
            gameManager.lightblockers.push(this.shape.uuid);
            layer.addShape(this.shape, true, false);
        },
        onMouseMove(event: MouseEvent) {
            const endPoint = l2g(getMouse(event));
            const layer = gameManager.layerManager.getLayer();
            if (layer === undefined) {
                console.log("No active layer!");
                return;
            }

            if (this.brushHelper !== null) {
                this.brushHelper.r = this.helperSize;
                this.brushHelper.refPoint = endPoint;
                if (!this.active)
                    layer.invalidate(false);
            }

            if (!this.active || this.startPoint === null || this.shape === null) return;

            if (this.shapeSelect === 'square') {
                (<Rect>this.shape).w = Math.abs(endPoint.x - this.startPoint.x);
                (<Rect>this.shape).h = Math.abs(endPoint.y - this.startPoint.y);
                this.shape.refPoint.x = Math.min(this.startPoint.x, endPoint.x);
                this.shape.refPoint.y = Math.min(this.startPoint.y, endPoint.y);
            } else if (this.shapeSelect === 'circle') {
                (<Circle>this.shape).r = endPoint.subtract(this.startPoint).length();
            } else if (this.shapeSelect === 'paint-brush') {
                (<MultiLine>this.shape).points.push(endPoint);
            }
            socket.emit("shapeMove", { shape: this.shape!.asDict(), temporary: false });
            if (this.shape.visionObstruction) gameManager.recalculateBoundingVolume();
            layer.invalidate(false);
        },
        onMouseUp(event: MouseEvent) {
            if (this.active && this.shape !== null && !event.altKey && Settings.useGrid) {
                this.shape.resizeToGrid();
            }
            this.active = false;
        },
        onSelect() {
            const layer = gameManager.layerManager.getLayer();
            if (layer === undefined) return;
            this.brushHelper = new Circle(new GlobalPoint(0, 0), this.brushSize / 2, this.fillRgb);
            layer.addShape(this.brushHelper, false);
        },
        onDeselect() {
            const layer = gameManager.layerManager.getLayer();
            if (this.brushHelper !== null && layer !== undefined)
                layer.removeShape(this.brushHelper, false);
        }
    }
})
</script>

<style scoped>
.option {
    padding: 6px;
    border: solid 1px #82c8a0;
    border-radius: 0;
    flex: 1 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 13px;
}
.option-selected, .option:hover {
    background-color: #82c8a0;
}
.selectgroup {
    display: flex;
}
.selectgroup > .option:first-of-type {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
}
.selectgroup > .option:last-of-type {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
}
</style>
