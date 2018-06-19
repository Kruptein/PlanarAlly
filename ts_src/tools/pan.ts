import { Tool } from "./tool";
import { LocalPoint } from "../geom";
import { getMouse } from "../utils";
import gameManager from "../planarally";
import { sendClientOptions } from "../socket";
import Settings from "../settings";

export class PanTool extends Tool {
    panStart = new LocalPoint(0, 0);
    active: boolean = false;
    onMouseDown(e: MouseEvent): void {
        this.panStart = getMouse(e);
        this.active = true;
    };
    onMouseMove(e: MouseEvent): void {
        if (!this.active) return;
        const mouse = getMouse(e);
        const distance = mouse.subtract(this.panStart).multiply(1/Settings.zoomFactor);
        Settings.panX += Math.round(distance.x);
        Settings.panY += Math.round(distance.y);
        this.panStart = mouse;
        gameManager.layerManager.invalidate();
    };
    onMouseUp(e: MouseEvent): void {
        this.active = false;
        sendClientOptions();
    };
    onContextMenu(e: MouseEvent) { };
}