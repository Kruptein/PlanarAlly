<template>
    <div class="tool-detail" v-if="selected" :style="{ '--detailRight': detailRight, '--detailArrow': detailArrow }">
        <div>#X</div>
        <input type="text" v-model="xCount" />
        <div>#Y</div>
        <input type="text" v-model="yCount" />
    </div>
</template>

<script lang="ts">
import Tool from "@/game/ui/tools/tool.vue";

import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { BaseRect } from "@/game/shapes/baserect";
import { Rect } from "@/game/shapes/rect";
import { gameStore } from "@/game/store";
import { l2g } from "@/game/units";
import { getMouse } from "@/game/utils";
import Component from "vue-class-component";

@Component
export default class MapTool extends Tool {
    name = "Map";
    active = false;
    xCount = 3;
    yCount = 3;
    startPoint: GlobalPoint | null = null;
    rect: Rect | null = null;

    onMouseDown(event: MouseEvent): void {
        const layer = layerManager.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;

        this.startPoint = l2g(getMouse(event));
        this.rect = new Rect(this.startPoint.clone(), 0, 0, "rgba(0,0,0,0)", "black");
        layer.addShape(this.rect, false, false);
    }
    onMouseMove(event: MouseEvent): void {
        if (!this.active || this.rect === null || this.startPoint === null) return;
        const layer = layerManager.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        const endPoint = l2g(getMouse(event));

        this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect.refPoint = new GlobalPoint(
            Math.min(this.startPoint.x, endPoint.x),
            Math.min(this.startPoint.y, endPoint.y),
        );
        layer.invalidate(false);
    }
    onMouseUp(_event: MouseEvent): void {
        if (!this.active || this.rect === null) return;
        const layer = layerManager.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = false;

        if (layer.selection.length !== 1) {
            layer.removeShape(this.rect, false, false);
            return;
        }

        const w = this.rect.w;
        const h = this.rect.h;
        const sel = layer.selection[0];

        if (sel instanceof BaseRect) {
            sel.w *= (this.xCount * gameStore.gridSize) / w;
            sel.h *= (this.yCount * gameStore.gridSize) / h;
        }

        layer.removeShape(this.rect, false, false);
    }
}
</script>
