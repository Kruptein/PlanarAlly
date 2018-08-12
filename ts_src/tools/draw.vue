<template>
    <div class='tool-detail' v-if="selected" :style="{'--detailRight': detailRight, '--detailArrow': detailArrow}">
        <div>Fill</div>
        <color-picker :color.sync="fillColour" />
        <div>Border</div>
        <color-picker :color.sync="borderColour" />
        <div>Shape</div>
        <select v-model='shapeSelect'>
            <option value='square'>&#xf0c8;</option>
            <option value='circle'>&#xf111;</option>
        </select>
    </div>
</template>

<script lang="ts">
import Tool from "./tool.vue";

import gameManager from "../planarally";
import { getMouse } from "../utils";
import { l2g } from "../units";
import { GlobalPoint } from "../geom";
import colorpicker from "../../vue/components/colorpicker.vue";
import Rect from "../shapes/rect";
import Circle from "../shapes/circle";
import Settings from "../settings";
import Shape from "../shapes/shape";
import { socket } from "../socket";


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
            fillColour: {rgba: {r: 0, g: 0, b: 0, a: 1}},
            borderColour: {rgba: {r: 255, g: 255, b: 255, a: 1}},
            shapeSelect: "square",
        }
    },
    computed: {
        fillRgb(): string {
            return tinycolor(this.fillColour.rgba).toRgbString();
        },
        borderRgb(): string {
            return tinycolor(this.borderColour.rgba).toRgbString();
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
            else return;

            this.shape.owners.push(Settings.username);
            if (layer.name === 'fow') {
                this.shape.visionObstruction = true;
                this.shape.movementObstruction = true;
            }
            gameManager.lightblockers.push(this.shape.uuid);
            layer.addShape(this.shape, true, false);
        },
        onMouseMove(event: MouseEvent) {
            if (!this.active || this.startPoint === null || this.shape === null) return;
            const layer = gameManager.layerManager.getLayer();
            if (layer === undefined) {
                console.log("No active layer!");
                return;
            }
            const endPoint = l2g(getMouse(event));

            if (this.shapeSelect === 'square') {
                (<Rect>this.shape).w = Math.abs(endPoint.x - this.startPoint.x);
                (<Rect>this.shape).h = Math.abs(endPoint.y - this.startPoint.y);
                this.shape.refPoint.x = Math.min(this.startPoint.x, endPoint.x);
                this.shape.refPoint.y = Math.min(this.startPoint.y, endPoint.y);
            } else if (this.shapeSelect === 'circle') {
                (<Circle>this.shape).r = endPoint.subtract(this.startPoint).length();
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
        }
    }
})
</script>
