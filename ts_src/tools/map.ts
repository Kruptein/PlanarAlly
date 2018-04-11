import { Tool } from "./tool";
import { GlobalPoint } from "../geom";
import Rect from "../shapes/rect";
import gameManager from "../planarally";
import { getMouse } from "../utils";
import { l2g } from "../units";
import BaseRect from "../shapes/baserect";

export class MapTool extends Tool {
    active: boolean = false;
    startPoint!: GlobalPoint;
    rect!: Rect;
    xCount = $("<input type='text' value='3'>");
    yCount = $("<input type='text' value='3'>");
    detailDiv = $("<div>")
        .append($("<div>#X</div>")).append(this.xCount)
        .append($("<div>#Y</div>")).append(this.yCount)
        .append($("</div>"));
    onMouseDown(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = gameManager.layerManager.getLayer()!;
        this.startPoint = l2g(getMouse(e));
        this.rect = new Rect(this.startPoint, 0, 0, "rgba(0,0,0,0)", "black");
        layer.addShape(this.rect, false, false);
    }
    onMouseMove(e: MouseEvent) {
        if (!this.active) return;
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = gameManager.layerManager.getLayer()!;
        const endPoint = l2g(getMouse(e));

        this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect.refPoint.x = Math.min(this.startPoint.x, endPoint.x);
        this.rect.refPoint.y = Math.min(this.startPoint.y, endPoint.y);
        layer.invalidate(false);
    }
    onMouseUp(e: MouseEvent) {
        if (!this.active) return;
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = false;
        const layer = gameManager.layerManager.getLayer()!;
        if (layer.selection.length !== 1) {
            layer.removeShape(this.rect!, false, false);
            return;
        }

        const w = this.rect.w;
        const h = this.rect.h;
        const sel = layer.selection[0];

        if (sel instanceof BaseRect) {
            sel.w *= parseInt(<string>this.xCount.val()) * gameManager.layerManager.gridSize / w;
            sel.h *= parseInt(<string>this.yCount.val()) * gameManager.layerManager.gridSize / h;
            console.log("Updated selection");
        }

        layer.removeShape(this.rect, false, false);
    }
}