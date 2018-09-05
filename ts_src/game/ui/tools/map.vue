<template>
    <div class='tool-detail' v-if="selected" :style="{'--detailRight': detailRight, '--detailArrow': detailArrow}">
        <div>#X</div>
        <input type='text' v-model="xCount">
        <div>#Y</div>
        <input type='text' v-model='yCount'>
    </div>
</template>

<script lang="ts">
import { mapState } from "vuex";

import gameManager from "../../manager";
import BaseRect from "../../shapes/baserect";
import Rect from "../../shapes/rect";
import Tool from "./tool.vue";

import { GlobalPoint } from "../../geom";
import { l2g } from "../../units";
import { getMouse } from "../../utils";

export default Tool.extend({
    data: () => ({
        name: "map",
        active: false,
        xCount: 3,
        yCount: 3,
        startPoint: <GlobalPoint | null>null,
        rect: <Rect | null>null,
    }),
    computed: {
        ...mapState(["gridSize"]),
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
            this.rect = new Rect(this.startPoint.clone(), 0, 0, "rgba(0,0,0,0)", "black");
            layer.addShape(this.rect, false, false);
        },
        onMouseMove(event: MouseEvent) {
            if (!this.active || this.rect === null || this.startPoint === null) return;
            const layer = gameManager.layerManager.getLayer();
            if (layer === undefined) {
                console.log("No active layer!");
                return;
            }

            const endPoint = l2g(getMouse(event));

            this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
            this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
            this.rect.refPoint.x = Math.min(this.startPoint.x, endPoint.x);
            this.rect.refPoint.y = Math.min(this.startPoint.y, endPoint.y);
            layer.invalidate(false);
        },
        onMouseUp(event: MouseEvent) {
            if (!this.active || this.rect === null) return;
            const layer = gameManager.layerManager.getLayer();
            if (layer === undefined) {
                console.log("No active layer!");
                return;
            }
            this.active = false;

            if (layer.selection.length !== 1) {
                layer.removeShape(this.rect!, false, false);
                return;
            }

            const w = this.rect.w;
            const h = this.rect.h;
            const sel = layer.selection[0];

            if (sel instanceof BaseRect) {
                sel.w *= this.xCount * this.gridSize / w;
                sel.h *= this.yCount * this.gridSize / h;
                console.log("Updated selection");
            }

            layer.removeShape(this.rect, false, false);
        },
    },
});
</script>
