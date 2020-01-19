import Component from "vue-class-component";

import Tool from "@/game/ui/tools/tool.vue";

import { socket } from "@/game/api/socket";
import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { Circle } from "@/game/shapes/circle";
import { gameStore } from "@/game/store";
import { l2g } from "@/game/units";
import { getMouse } from "@/game/utils";
import { SyncMode } from "@/core/comm/types";

@Component
export class PingTool extends Tool {
    name = "Ping";
    active = false;
    startPoint: GlobalPoint | null = null;
    ping: Circle | null = null;
    border: Circle | null = null;
    onMouseDown(event: MouseEvent): void {
        const layer = layerManager.getLayer("draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }
        this.active = true;
        this.startPoint = l2g(getMouse(event));
        this.ping = new Circle(this.startPoint, 20, gameStore.rulerColour);
        this.border = new Circle(this.startPoint, 40, "#0000", gameStore.rulerColour);
        this.ping.addOwner(gameStore.username);
        this.border.addOwner(gameStore.username);
        layer.addShape(this.ping, SyncMode.TEMP_SYNC);
        layer.addShape(this.border, SyncMode.TEMP_SYNC);
    }
    onMouseMove(event: MouseEvent): void {
        if (!this.active || this.ping === null || this.border === null || this.startPoint === null) return;

        const layer = layerManager.getLayer("draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }
        const endPoint = l2g(getMouse(event));

        this.ping.center(endPoint);
        this.border.center(endPoint);

        socket.emit("Shape.Update", { shape: this.ping!.asDict(), redraw: true, temporary: true });
        socket.emit("Shape.Update", { shape: this.border!.asDict(), redraw: true, temporary: true });

        layer.invalidate(true);
    }
    onMouseUp(_event: MouseEvent): void {
        if (!this.active || this.ping === null || this.border === null || this.startPoint === null) return;

        const layer = layerManager.getLayer("draw");
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = false;
        layer.removeShape(this.ping, SyncMode.TEMP_SYNC);
        layer.removeShape(this.border, SyncMode.TEMP_SYNC);
        layer.invalidate(true);
        this.ping = null;
        this.startPoint = null;
    }
}
