<script lang="ts">
import Component from "vue-class-component";

import Tool from "@/game/ui/tools/tool.vue";

import { GlobalPoint, Vector, LocalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { BaseRect } from "@/game/shapes/baserect";
import { Rect } from "@/game/shapes/rect";
import { l2g } from "@/game/units";
import { SyncMode, InvalidationMode } from "../../../core/comm/types";
import { SelectFeatures } from "./select.vue";
import { ToolName, ToolPermission } from "./utils";
import { EventBus } from "@/game/event-bus";
import { Shape } from "@/game/shapes/shape";
import { gameSettingsStore } from "../../settings";
import { ToolBasics } from "./ToolBasics";

@Component
export default class MapTool extends Tool implements ToolBasics {
    name = ToolName.Map;
    active = false;
    xCount = 3;
    yCount = 3;
    startPoint: GlobalPoint | null = null;
    rect: Rect | null = null;
    shape: Shape | null = null;

    shapeSelected = false;

    permittedTools_: ToolPermission[] = [
        { name: ToolName.Select, features: { enabled: [SelectFeatures.ChangeSelection] } },
    ];

    get permittedTools(): ToolPermission[] {
        return this.permittedTools_;
    }

    // Life cycle

    mounted(): void {
        EventBus.$on("SelectionInfo.Shape.Set", (shape: Shape | null) => {
            this.shapeSelected = shape !== null;
        });
    }

    beforeDestroy(): void {
        EventBus.$off("SelectionInfo.Shape.Set");
    }

    // End life cycle

    removeRect(): void {
        if (this.rect) {
            const layer = layerManager.getLayer(layerManager.floor!.name)!;
            layer.removeShape(this.rect, SyncMode.NO_SYNC);
            this.rect = null;
        }
        this.permittedTools_ = [{ name: ToolName.Select, features: { enabled: [SelectFeatures.ChangeSelection] } }];
        this.shapeSelected = false;
        this.shape = null;
    }

    apply(): void {
        if (this.shape === null || this.rect === null) return;
        const oldRefpoint = this.shape.refPoint;
        const oldCenter = this.rect.center();

        if (this.shape instanceof BaseRect) {
            const xFactor = (this.xCount * gameSettingsStore.gridSize) / this.rect.w;
            const yFactor = (this.yCount * gameSettingsStore.gridSize) / this.rect.h;

            this.shape.w *= xFactor;
            this.shape.h *= yFactor;

            const delta = oldCenter.subtract(oldRefpoint);
            const newCenter = oldRefpoint.add(new Vector(xFactor * delta.x, yFactor * delta.y));
            this.shape.refPoint = this.shape.refPoint.add(oldCenter.subtract(newCenter));
        }
        this.removeRect();
    }

    onSelect(): void {
        this.shapeSelected = (layerManager.getSelection()?.length || 0) === 1;
    }

    onDeselect(): void {
        this.removeRect();
    }

    onDown(lp: LocalPoint): void {
        if (this.rect !== null || !layerManager.hasSelection()) return;

        const startPoint = l2g(lp);

        this.startPoint = startPoint;
        const layer = layerManager.getLayer(layerManager.floor!.name);
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;

        this.rect = new Rect(this.startPoint.clone(), 0, 0, "rgba(0,0,0,0)", "black");
        this.rect.preventSync = true;
        layer.addShape(this.rect, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        this.shape = layer.selection[0];
        layer.selection = [this.rect];
    }

    onMove(lp: LocalPoint): void {
        if (!this.active || this.rect === null || this.startPoint === null) return;

        const endPoint = l2g(lp);

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

        this.permittedTools_ = [
            { name: ToolName.Select, features: { enabled: [SelectFeatures.Drag, SelectFeatures.Resize] } },
        ];
    }
}
</script>

<template>
    <div
        class="tool-detail map"
        v-if="selected"
        :style="{ '--detailRight': detailRight, '--detailArrow': detailArrow }"
    >
        <template v-if="shapeSelected">
            <template v-if="rect === null">{{ $t("game.ui.tools.map.drag_to_resize") }}</template>
            <template v-else>
                <div class="explanation" v-t="'game.ui.tools.map.set_target_grid_cells'"></div>
                <div v-t="'game.ui.tools.map.horizontal'"></div>
                <input type="text" v-model="xCount" class="hinput" />
                <div v-t="'game.ui.tools.map.vertical'"></div>
                <input type="text" v-model="yCount" class="vinput" />
                <div class="button apply" @click="apply" v-t="'game.ui.tools.map.apply'"></div>
                <div class="button cancel" @click="removeRect" v-t="'game.ui.tools.map.cancel'"></div>
            </template>
        </template>
        <template v-else>{{ $t("game.ui.tools.map.select_shape_msg") }}</template>
    </div>
</template>

<style scoped>
.map {
    display: grid;
    grid-template-areas:
        "text text"
        "horiz hinput"
        "verti vinput"
        "submit cancel";
}

.map > * {
    text-align: right;
}

.explanation {
    grid-area: text;
    text-align: center;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid black;
}

.horiz {
    grid-area: horiz;
    padding: 2px;
}

.verti {
    grid-area: verti;
    padding: 2px;
}

.hinput,
.vinput {
    width: 75px;
    padding: 2px;
}

.hinput {
    grid-area: hinput;
}

.vinput {
    grid-area: vinput;
}

.button {
    margin-top: 10px;
    margin-bottom: 5px;
    padding: 5px;
    font-size: 15px;
    font-weight: bold;
    text-align: center;
    font-style: italic;
    border: solid 1px black;
}
.button:hover {
    font-style: normal;
    cursor: pointer;
    margin-top: 8px;
    margin-bottom: 7px;
    box-shadow: 1px 3px;
}

.apply {
    grid-area: submit;
    font-weight: bold;
    box-shadow: 1px 1px 0px black;
}

.cancel {
    grid-area: cancel;
    color: lightcoral;
    border-color: lightcoral;
    box-shadow: 1px 1px lightcoral;
}
</style>
