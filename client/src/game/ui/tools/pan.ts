import Tool from "@/game/ui/tools/tool.vue";

import { sendClientOptions } from "@/game/api/utils";
import { LocalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { getMouse } from "@/game/utils";
import Component from "vue-class-component";

@Component
export default class PanTool extends Tool {
    name = "Pan";
    panStart = new LocalPoint(0, 0);
    active = false;

    onMouseDown(event: MouseEvent): void {
        this.panStart = getMouse(event);
        this.active = true;
    }
    onMouseMove(event: MouseEvent): void {
        if (!this.active) return;
        const mouse = getMouse(event);
        const distance = mouse.subtract(this.panStart).multiply(1 / gameStore.zoomFactor);
        gameStore.increasePanX(Math.round(distance.x));
        gameStore.increasePanY(Math.round(distance.y));
        this.panStart = mouse;
        layerManager.invalidate();
    }
    onMouseUp(_event: MouseEvent): void {
        this.active = false;
        sendClientOptions(gameStore.locationOptions);
    }
}
