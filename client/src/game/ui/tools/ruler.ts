import Component from "vue-class-component";

import Tool from "@/game/ui/tools/tool.vue";

import { socket } from "@/game/api/socket";
import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { Line } from "@/game/shapes/line";
import { Text } from "@/game/shapes/text";
import { gameStore } from "@/game/store";
import { l2g, l2gz } from "@/game/units";
import { getLocalPointFromEvent } from "@/game/utils";
import { SyncMode, InvalidationMode } from "@/core/comm/types";

@Component
export class RulerTool extends Tool {
    name = "Ruler";
    active = false;
    startPoint: GlobalPoint | null = null;
    ruler: Line | null = null;
    text: Text | null = null;

    onDown(gp: GlobalPoint): void {
        this.startPoint = gp;

        const layer = layerManager.getLayer(layerManager.floor!.name, "draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }
        this.active = true;
        this.ruler = new Line(this.startPoint, this.startPoint, l2gz(3), gameStore.rulerColour);
        this.text = new Text(this.startPoint.clone(), "", "bold 20px serif");
        this.ruler.addOwner(gameStore.username);
        this.text.addOwner(gameStore.username);
        layer.addShape(this.ruler, SyncMode.TEMP_SYNC, InvalidationMode.NORMAL);
        layer.addShape(this.text, SyncMode.TEMP_SYNC, InvalidationMode.NORMAL);
    }

    onMove(endPoint: GlobalPoint): void {
        if (!this.active || this.ruler === null || this.startPoint === null || this.text === null) return;

        const layer = layerManager.getLayer(layerManager.floor!.name, "draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }

        this.ruler.endPoint = endPoint;
        socket.emit("Shape.Update", { shape: this.ruler!.asDict(), redraw: true, temporary: true });

        const diffsign = Math.sign(endPoint.x - this.startPoint.x) * Math.sign(endPoint.y - this.startPoint.y);
        const xdiff = Math.abs(endPoint.x - this.startPoint.x);
        const ydiff = Math.abs(endPoint.y - this.startPoint.y);
        const label =
            Math.round((Math.sqrt(xdiff ** 2 + ydiff ** 2) * gameStore.unitSize) / gameStore.gridSize) +
            " " +
            gameStore.unitSizeUnit;
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

        layer.removeShape(this.ruler, SyncMode.TEMP_SYNC);
        layer.removeShape(this.text, SyncMode.TEMP_SYNC);
        layer.invalidate(true);
        this.ruler = this.startPoint = this.text = null;
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
