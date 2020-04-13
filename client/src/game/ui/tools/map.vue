<script lang="ts">
import Component from "vue-class-component";

import Tool from "@/game/ui/tools/tool.vue";

import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { BaseRect } from "@/game/shapes/baserect";
import { Rect } from "@/game/shapes/rect";
import { gameStore } from "@/game/store";
import { l2g } from "@/game/units";
import { getLocalPointFromEvent } from "@/game/utils";
import { SyncMode, InvalidationMode } from "../../../core/comm/types";
import { SelectFeatures } from "./select.vue";
import { ToolName } from "./utils";

@Component
export default class MapTool extends Tool {
    name = ToolName.Map;
    active = false;
    xCount = 3;
    yCount = 3;
    startPoint: GlobalPoint | null = null;
    rect: Rect | null = null;

    get permittedTools(): { name: ToolName; features: number[] }[] {
        return [{ name: ToolName.Select, features: [SelectFeatures.Drag, SelectFeatures.Resize] }];
    }

    shapeSelected(): boolean {
        return (layerManager.getSelection()?.length || 0) > 0;
    }

    removeRect(): void {
        if (this.rect) {
            const layer = layerManager.getLayer(layerManager.floor!.name)!;
            layer.removeShape(this.rect, SyncMode.NO_SYNC);
            this.rect = null;
        }
    }

    onDeselect(): void {
        this.removeRect();
    }

    onDown(startPoint: GlobalPoint): void {
        if (this.rect !== null) return;

        this.startPoint = startPoint;
        const layer = layerManager.getLayer(layerManager.floor!.name);
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;

        this.rect = new Rect(this.startPoint.clone(), 0, 0, "rgba(0,0,0,0)", "black");
        layer.addShape(this.rect, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        layer.selection = [this.rect];
    }

    onMove(endPoint: GlobalPoint): void {
        if (!this.active || this.rect === null || this.startPoint === null) return;
        const layer = layerManager.getLayer(layerManager.floor!.name);
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect.refPoint = new GlobalPoint(
            Math.min(this.startPoint.x, endPoint.x),
            Math.min(this.startPoint.y, endPoint.y),
        );
        layer.invalidate(false);
    }

    onUp(): void {
        if (!this.active || this.rect === null) return;
        const layer = layerManager.getLayer(layerManager.floor!.name);
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = false;

        if (layer.selection.length !== 1) {
            this.removeRect();
            return;
        }

        // const w = this.rect.w;
        // const h = this.rect.h;
        // const sel = layer.selection[0];

        // if (sel instanceof BaseRect) {
        //     sel.w *= (this.xCount * gameStore.gridSize) / w;
        //     sel.h *= (this.yCount * gameStore.gridSize) / h;
        // }
    }

    onMouseDown(event: MouseEvent): void {
        const startPoint = l2g(getLocalPointFromEvent(event));
        this.onDown(startPoint);
    }

    onMouseMove(event: MouseEvent): void {
        const endPoint = l2g(getLocalPointFromEvent(event));
        this.onMove(endPoint);
    }

    onMouseUp(_event: MouseEvent): void {
        this.onUp();
    }

    onTouchStart(event: TouchEvent): void {
        const startPoint = l2g(getLocalPointFromEvent(event));
        this.onDown(startPoint);
    }

    onTouchMove(event: TouchEvent): void {
        const endPoint = l2g(getLocalPointFromEvent(event));
        this.onMove(endPoint);
    }

    onTouchEnd(_event: TouchEvent): void {
        this.onUp();
    }
}
</script>

<template>
    <div class="tool-detail" v-if="selected" :style="{ '--detailRight': detailRight, '--detailArrow': detailArrow }">
        <div v-if="shapeSelected()">
            <div v-if="rect === null">Drag an area you wish to resize</div>
            <div v-else>
                <div>#X</div>
                <input type="text" v-model="xCount" />
                <div>#Y</div>
                <input type="text" v-model="yCount" />
            </div>
        </div>
        <div v-else>Please select a shape first.</div>
    </div>
</template>
