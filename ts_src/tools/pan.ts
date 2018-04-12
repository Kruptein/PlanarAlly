import { Tool } from "./tool";
import { LocalPoint } from "../geom";
import { getMouse } from "../utils";
import gameManager from "../planarally";
import { l2g } from "../units";
import socket from "../socket";
import { Settings } from "../settings";

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
        const z = Settings.zoomFactor;
        const distance = l2g(mouse.subtract(this.panStart)).direction;
        Settings.panX += Math.round(distance.x);
        Settings.panY += Math.round(distance.y);
        this.panStart = mouse;
        gameManager.layerManager.invalidate();
    };
    onMouseUp(e: MouseEvent): void {
        this.active = false;
        socket.emit("set clientOptions", {
            locationOptions: {
                [`${gameManager.roomName}/${gameManager.roomCreator}/${gameManager.locationName}`]: {
                    panX: Settings.panX,
                    panY: Settings.panY
                }
            }
        });
    };
    onContextMenu(e: MouseEvent) { };
}