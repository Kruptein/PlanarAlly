import debounce from "lodash/debounce";
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
    debouncedMouseMove = debounce(this.onMouseStop, 250);
    onMouseDown(event: MouseEvent): void {
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
    onMouseMove(event: MouseEvent): void {
        if (!this.active || this.ping === null || this.startPoint === null) return;

        const layer = layerManager.getLayer("draw");
        if (layer === undefined) {
            console.log("No draw layer!");
            return;
        }
        this.debouncedMouseMove(event);
        const endPoint = l2g(getMouse(event));

        this.ping.center(endPoint);
        this.ping.r = 30;

        socket.emit("Shape.Update", { shape: this.ping!.asDict(), redraw: true, temporary: true });

        layer.invalidate(true);
    }
    onMouseUp(_event: MouseEvent): void {
        if (!this.active || this.ping === null || this.startPoint === null) return;

        const layer = layerManager.getLayer("draw");
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.debouncedMouseMove.cancel();
        this.active = false;
        layer.removeShape(this.ping, true, true);
        layer.invalidate(true);
        this.ping = null;
        this.startPoint = null;
    }
    onMouseStop(_event: MouseEvent): void {
        if (!this.active || this.ping === null || this.startPoint === null) return;

        const layer = layerManager.getLayer("draw");
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.ping.r = 20;
        socket.emit("Shape.Update", { shape: this.ping!.asDict(), redraw: true, temporary: true });

        layer.invalidate(true);
    }
}
