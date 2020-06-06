<script lang="ts">
import Component from "vue-class-component";

import Tool from "@/game/ui/tools/tool.vue";

import { GlobalPoint, LocalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { l2g, l2gz } from "@/game/units";
import { SyncMode, InvalidationMode } from "../../../core/comm/types";
import { ToolName } from "./utils";
import { gameSettingsStore } from "../../settings";
import { ToolBasics } from "./ToolBasics";
import { Line } from "@/game/shapes/line";
import { gameStore } from "@/game/store";
import { Text } from "../../shapes/text";
import { socket } from "@/game/api/socket";

@Component
export default class RulerTool extends Tool implements ToolBasics {
    name = ToolName.Ruler;
    active = false;
    startPoint: GlobalPoint | null = null;
    ruler: Line | null = null;
    text: Text | null = null;

    showPublic = true;

    get syncMode(): SyncMode {
        if (this.showPublic) return SyncMode.TEMP_SYNC;
        return SyncMode.NO_SYNC;
    }

    onDown(lp: LocalPoint): void {
        this.startPoint = l2g(lp);

        const layer = layerManager.getLayer(layerManager.floor!.name, "draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }
        this.active = true;
        this.ruler = new Line(this.startPoint, this.startPoint, l2gz(3), gameStore.rulerColour);
        this.text = new Text(this.startPoint.clone(), "", "bold 20px serif");
        this.ruler.addOwner({ user: gameStore.username, access: { edit: true } }, false);
        this.text.addOwner({ user: gameStore.username, access: { edit: true } }, false);
        layer.addShape(this.ruler, this.syncMode, InvalidationMode.NORMAL);
        layer.addShape(this.text, this.syncMode, InvalidationMode.NORMAL);
    }

    onMove(lp: LocalPoint): void {
        const endPoint = l2g(lp);
        if (!this.active || this.ruler === null || this.startPoint === null || this.text === null) return;

        const layer = layerManager.getLayer(layerManager.floor!.name, "draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }

        this.ruler.endPoint = endPoint;
        socket.emit("Shape.Update", { shape: this.ruler.asDict(), redraw: true, temporary: true });

        const diffsign = Math.sign(endPoint.x - this.startPoint.x) * Math.sign(endPoint.y - this.startPoint.y);
        const xdiff = Math.abs(endPoint.x - this.startPoint.x);
        const ydiff = Math.abs(endPoint.y - this.startPoint.y);
        const distance = (Math.sqrt(xdiff ** 2 + ydiff ** 2) * gameSettingsStore.unitSize) / gameSettingsStore.gridSize;

        // round to 1 decimal
        const label = Math.round(10 * distance) / 10 + " " + gameSettingsStore.unitSizeUnit;
        const angle = Math.atan2(diffsign * ydiff, xdiff);
        const xmid = Math.min(this.startPoint.x, endPoint.x) + xdiff / 2;
        const ymid = Math.min(this.startPoint.y, endPoint.y) + ydiff / 2;
        this.text.refPoint = new GlobalPoint(xmid, ymid);
        this.text.text = label;
        this.text.angle = angle;
        socket.emit("Shape.Update", { shape: this.text.asDict(), redraw: true, temporary: true });
        layer.invalidate(true);
    }

    onUp(): void {
        if (!this.active || this.ruler === null || this.startPoint === null || this.text === null) return;

        const layer = layerManager.getLayer(layerManager.floor!.name, "draw");
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = false;

        layer.removeShape(this.ruler, this.syncMode);
        layer.removeShape(this.text, this.syncMode);
        this.ruler = this.startPoint = this.text = null;
    }

    toggle(event: MouseEvent): void {
        const button = <HTMLButtonElement>event.target;
        const state = button.getAttribute("aria-pressed") ?? "false";
        this.showPublic = state === "false";
        if (state == "false") button.setAttribute("aria-pressed", "true");
        else button.setAttribute("aria-pressed", "false");
    }
}
</script>

<template>
    <div
        id="ruler"
        class="tool-detail"
        v-if="selected"
        :style="{ '--detailRight': detailRight, '--detailArrow': detailArrow }"
    >
        <button @click="toggle" aria-pressed="true" v-t="'game.ui.tools.ruler.share'"></button>
    </div>
</template>

<style scoped>
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
}

button:hover::before {
    box-shadow: 0 0 0.5em #333;
}

button:hover::after {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='rgba(0,0,0,.25)'/%3E%3C/svg%3E");
    background-size: 30%;
    background-repeat: no-repeat;
    background-position: center center;
}

button::before,
button::after {
    content: "";
    position: absolute;
    height: 1.1em;
    transition: all 0.25s ease;
}

button::before {
    left: 0;
    top: 0.4em;
    width: 2.6em;
    border: 0.2em solid #767676;
    background: #767676;
    border-radius: 1.1em;
}

button::after {
    left: 0;
    top: 0.45em;
    background-color: #fff;
    background-position: center center;
    border-radius: 50%;
    width: 1.1em;
    border: 0.15em solid #767676;
}

button[aria-pressed="true"]::after {
    left: 1.6em;
    border-color: #36a829;
    color: #36a829;
}

button[aria-pressed="true"]::before {
    background-color: #36a829;
    border-color: #36a829;
}
</style>
