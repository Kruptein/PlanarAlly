import Component from "vue-class-component";

import Tool from "@/game/ui/tools/tool.vue";

import { sendClientOptions } from "@/game/api/utils";
import { LocalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { getLocalPointFromEvent } from "@/game/utils";

@Component
export default class PanTool extends Tool {
    name = "Pan";
    panStart = new LocalPoint(0, 0);
    active = false;

    panScreen(l: LocalPoint): void {
        const distance = l.subtract(this.panStart).multiply(1 / gameStore.zoomFactor);
        gameStore.increasePanX(Math.round(distance.x));
        gameStore.increasePanY(Math.round(distance.y));
        this.panStart = l;
        layerManager.invalidateAllFloors();
    }

    onMouseDown(event: MouseEvent): void {
        this.panStart = getLocalPointFromEvent(event);
        this.active = true;
    }

    onMouseMove(event: MouseEvent): void {
        if (!this.active) return;
        const mouse = getLocalPointFromEvent(event);
        this.panScreen(mouse);
    }

    onMouseUp(_event: MouseEvent): void {
        this.active = false;
        sendClientOptions(gameStore.locationOptions);
    }

    onTouchStart(event: TouchEvent): void {
        this.panStart = getLocalPointFromEvent(event);
        this.active = true;
    }

    onTouchEnd(_event: TouchEvent): void {
        this.active = false;
        sendClientOptions(gameStore.locationOptions);
    }

    onTouchMove(event: TouchEvent): void {
        if (!this.active) return;
        // get the point of the mouse event
        const point = getLocalPointFromEvent(event);
        this.panScreen(point);
    }
}
