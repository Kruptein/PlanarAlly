<script lang="ts">
import Component from "vue-class-component";

import { sendShapePositionUpdate, sendTextUpdate } from "@/game/api/emits/shape/core";
import { GlobalPoint, LocalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { floorStore } from "@/game/layers/store";
import { snapToGridPoint } from "@/game/layers/utils";
import { Line } from "@/game/shapes/variants/line";
import { gameStore, DEFAULT_GRID_SIZE } from "@/game/store";
import Tool from "@/game/ui/tools/tool.vue";
import { l2g, l2gz } from "@/game/units";
import { useSnapping } from "@/game/utils";

import { SyncMode, InvalidationMode, SyncTo } from "../../../core/comm/types";
import { gameSettingsStore } from "../../settings";
import { Text } from "../../shapes/variants/text";

import { SelectFeatures } from "./select.vue";
import { ToolBasics } from "./ToolBasics";
import { ToolName, ToolPermission } from "./utils";

export enum RulerFeatures {
    All,
}

@Component
export default class RulerTool extends Tool implements ToolBasics {
    name = ToolName.Ruler;
    active = false;
    startPoint: GlobalPoint | undefined = undefined;
    rulers: Line[] = []; // These become reactive, but it's not the worst thing I suppose
    text: Text | undefined = undefined;

    currentLength = 0;
    previousLength = 0;

    showPublic = true;

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { enabled: [SelectFeatures.Context] } }];
    }

    get syncMode(): SyncMode {
        if (this.showPublic) return SyncMode.TEMP_SYNC;
        return SyncMode.NO_SYNC;
    }

    onKeyUp(event: KeyboardEvent): void {
        if (event.defaultPrevented) return;
        if (event.key === " " && this.active) {
            const lastRuler = this.rulers[this.rulers.length - 1];
            this.createNewRuler(lastRuler.endPoint, lastRuler.endPoint);
            this.previousLength += this.currentLength;

            const layer = layerManager.getLayer(floorStore.currentFloor, "draw");
            if (layer === undefined) {
                console.log("No draw layer!");
                return;
            }

            layer.moveShapeOrder(this.text!, layer.size({ includeComposites: true }) - 1, SyncMode.TEMP_SYNC);

            event.preventDefault();
        }
        this.defaultKeyUp(event);
    }

    cleanup(): void {
        if (!this.active || this.rulers.length === 0 || this.startPoint === undefined || this.text === undefined)
            return;

        const layer = layerManager.getLayer(floorStore.currentFloor, "draw");
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = false;

        for (const ruler of this.rulers) layer.removeShape(ruler, this.syncMode, true);
        layer.removeShape(this.text, this.syncMode, true);
        this.startPoint = this.text = undefined;
        this.rulers = [];
        this.previousLength = 0;
    }

    onDeselect(): void {
        this.cleanup();
    }

    onDown(lp: LocalPoint, event: MouseEvent | TouchEvent): void {
        this.cleanup();
        this.startPoint = l2g(lp);

        if (useSnapping(event)) [this.startPoint] = snapToGridPoint(this.startPoint);

        const layer = layerManager.getLayer(floorStore.currentFloor, "draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }
        this.active = true;
        this.createNewRuler(this.startPoint.clone(), this.startPoint.clone());
        this.text = new Text(this.startPoint.clone(), "", "bold 20px serif", {
            fillColour: "#000",
            strokeColour: "#fff",
        });
        this.text.addOwner({ user: gameStore.username, access: { edit: true } }, SyncTo.SHAPE);
        layer.addShape(this.text, this.syncMode, InvalidationMode.NORMAL);
    }

    onMove(lp: LocalPoint, event: MouseEvent | TouchEvent): void {
        let endPoint = l2g(lp);
        if (!this.active || this.rulers.length === 0 || this.startPoint === undefined || this.text === undefined)
            return;

        const layer = layerManager.getLayer(floorStore.currentFloor, "draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }

        if (useSnapping(event)) [endPoint] = snapToGridPoint(endPoint);

        const ruler = this.rulers[this.rulers.length - 1];
        ruler.endPoint = endPoint;
        sendShapePositionUpdate([ruler], true);

        const start = ruler.refPoint;
        const end = ruler.endPoint;

        const diffsign = Math.sign(end.x - start.x) * Math.sign(end.y - start.y);
        const xdiff = Math.abs(end.x - start.x);
        const ydiff = Math.abs(end.y - start.y);
        let distance = (Math.sqrt(xdiff ** 2 + ydiff ** 2) * gameSettingsStore.unitSize) / DEFAULT_GRID_SIZE;
        this.currentLength = distance;
        distance += this.previousLength;

        // round to 1 decimal
        const label = this.$n(Math.round(10 * distance) / 10) + " " + gameSettingsStore.unitSizeUnit;
        const angle = Math.atan2(diffsign * ydiff, xdiff);
        const xmid = Math.min(start.x, end.x) + xdiff / 2;
        const ymid = Math.min(start.y, end.y) + ydiff / 2;
        this.text.refPoint = new GlobalPoint(xmid, ymid);
        this.text.text = label;
        this.text.angle = angle;
        sendTextUpdate({ uuid: this.text.uuid, text: this.text.text, temporary: true });
        sendShapePositionUpdate([this.text], true);
        layer.invalidate(true);
    }

    onUp(): void {
        this.cleanup();
    }

    toggle(event: MouseEvent): void {
        const button = event.target as HTMLButtonElement;
        const state = button.getAttribute("aria-pressed") ?? "false";
        this.showPublic = state === "false";
    }

    createNewRuler(start: GlobalPoint, end: GlobalPoint): void {
        const ruler = new Line(start, end, {
            lineWidth: l2gz(3),
            strokeColour: gameStore.rulerColour,
        });

        const layer = layerManager.getLayer(floorStore.currentFloor, "draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }

        ruler.addOwner({ user: gameStore.username, access: { edit: true } }, SyncTo.SHAPE);
        layer.addShape(ruler, this.syncMode, InvalidationMode.NORMAL);
        this.rulers.push(ruler);
    }
}
</script>

<template>
    <div
        id="ruler"
        class="tool-detail"
        v-if="selected"
        :style="{ '--detailRight': detailRight(), '--detailArrow': detailArrow }"
    >
        <button @click="toggle" :aria-pressed="showPublic" v-t="'game.ui.tools.ruler.share'"></button>
    </div>
</template>

<style scoped lang="scss">
#ruler {
    display: flex;
}

button {
    display: block;
    box-sizing: border-box;
    border: none;
    color: inherit;
    background: none;
    font: inherit;
    line-height: inherit;
    text-align: left;
    padding: 0.4em 0 0.4em 4em;
    position: relative;
    outline: none;

    &:hover {
        &::before {
            box-shadow: 0 0 0.5em #333;
        }

        &::after {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='rgba(0,0,0,.25)'/%3E%3C/svg%3E");
            background-size: 30%;
            background-repeat: no-repeat;
            background-position: center center;
        }
    }

    &::before,
    &::after {
        content: "";
        position: absolute;
        height: 1.1em;
        transition: all 0.25s ease;
    }

    &::before {
        left: 0;
        top: 0.4em;
        width: 2.6em;
        border: 0.2em solid #767676;
        background: #767676;
        border-radius: 1.1em;
    }

    &::after {
        left: 0;
        top: 0.45em;
        background-color: #fff;
        background-position: center center;
        border-radius: 50%;
        width: 1.1em;
        border: 0.15em solid #767676;
    }

    &[aria-pressed="true"] {
        &::after {
            left: 1.6em;
            border-color: #36a829;
            color: #36a829;
        }

        &::before {
            background-color: #36a829;
            border-color: #36a829;
        }
    }
}
</style>
