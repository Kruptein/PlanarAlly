import { Tool } from "./tool";
import { GlobalPoint } from "../geom";
import Rect from "../shapes/rect";
import gameManager from "../planarally";
import { l2g } from "../units";
import { getMouse } from "../utils";
import socket from "../socket";

export class FOWTool extends Tool {
    active: boolean = false;
    startPoint!: GlobalPoint;
    rect!: Rect;
    detailDiv = $("<div>")
        .append($("<div>Reveal</div><label class='switch'><input type='checkbox' id='fow-reveal'><span class='slider round'></span></label>"))
        .append($("</div>"));
    onMouseDown(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = gameManager.layerManager.getLayer("fow")!;
        this.startPoint = l2g(getMouse(e));
        this.rect = new Rect(this.startPoint.clone(), 0, 0, "fog");
        layer.addShape(this.rect, true, false);

        if ($("#fow-reveal").prop("checked"))
            this.rect.globalCompositeOperation = "destination-out";
        else
            this.rect.globalCompositeOperation = "source-over";
    }
    onMouseMove(e: MouseEvent) {
        if (!this.active) return;
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        // Currently draw on active layer
        const layer = gameManager.layerManager.getLayer("fow")!;
        const endPoint = l2g(getMouse(e));

        this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect.refPoint.x = Math.min(this.startPoint.x, endPoint.x);
        this.rect.refPoint.y = Math.min(this.startPoint.y, endPoint.y);

        socket.emit("shapeMove", { shape: this.rect.asDict(), temporary: false });
        layer.invalidate(false);
    }
    onMouseUp(e: MouseEvent) {
        this.active = false;
    }
}