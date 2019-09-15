import Component from "vue-class-component";

import Tool from "@/game/ui/tools/tool.vue";

import { socket } from "@/game/api/socket";
import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { Circle } from "@/game/shapes/circle";
import { gameStore } from "@/game/store";
import { l2g } from "@/game/units";
import { getMouse } from "@/game/utils";

@Component
export class PingTool extends Tool {
    name = "Ping";
    active = false;
    startPoint: GlobalPoint | null = null;
    ping: Circle | null = null;
    onMouseDown(event: MouseEvent) {
        const layer = layerManager.getLayer("draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }
        this.active = true;
        this.startPoint = l2g(getMouse(event));
        this.ping = new Circle(this.startPoint, 20, gameStore.rulerColour);
        this.ping.addOwner(gameStore.username);
        layer.addShape(this.ping, true, true);
    }
    onMouseMove(event: MouseEvent) {
        if (!this.active || this.ping === null || this.startPoint === null) return;

        const layer = layerManager.getLayer("draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }
        const endPoint = l2g(getMouse(event));

        this.ping.center(endPoint);
        socket.emit("Shape.Update", { shape: this.ping!.asDict(), redraw: true, temporary: true });

        layer.invalidate(true);
    }
    onMouseUp(event: MouseEvent) {
        if (!this.active || this.ping === null || this.startPoint === null) return;

        const layer = layerManager.getLayer("draw");
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = false;
        layer.removeShape(this.ping, true, true);
        layer.invalidate(true);
        this.startPoint = null;
    }
}
