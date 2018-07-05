import { Tool } from "./tool";
import { GlobalPoint } from "../geom";
import gameManager from "../planarally";
import { getMouse } from "../utils";
import { l2g, getUnitDistance } from "../units";
import MultiLine from "../shapes/multiline";
import { socket } from "../socket";
import Circle from "../shapes/circle";

export class BrushTool extends Tool {
    active: boolean = false;
    startPoint: GlobalPoint = new GlobalPoint(0, 0);;
    brush!: MultiLine;
    brushHelper: Circle = new Circle(this.startPoint, 0);
    detailDiv = $("<div>")
        .append($("<div>Reveal</div><label class='switch'><input type='checkbox' id='brush-reveal'><span class='slider round'></span></label>"))
        .append($("<div>Size</div><input type='number' value='3' id='brush-size'>"))
        .append($("</div>"));
    onMouseDown(e: MouseEvent) {
        if (!gameManager.layerManager.getLayer("fow")) {
            console.log("No fow layer!");
            return;
        }
        this.active = true;
        this.startPoint = l2g(getMouse(e));
        this.brush = new MultiLine(this.startPoint.clone(), [], parseInt($("#brush-size").prop("value")));        

        const layer = gameManager.layerManager.getLayer("fow")!;

        if ($("#brush-reveal").prop("checked")) {
            this.brush.globalCompositeOperation = "destination-out";
            this.brush.fill = "rgba(0, 0, 0, 1)";
        } else {
            this.brush.globalCompositeOperation = "xor";
            this.brush.fill = "fog";
        }
        
        layer.addShape(this.brush, true, false);
    }
    onMouseMove(e: MouseEvent) {
        const mousePos = l2g(getMouse(e));
        this.brushHelper.refPoint = mousePos;
        this.brushHelper.r = getUnitDistance(parseInt($("#brush-size").prop("value")) / 2);
        if ($("#brush-reveal").prop("checked")) {
            this.brushHelper.globalCompositeOperation = "destination-out";
            this.brushHelper.fill = "rgba(0, 0, 0, 1)";
        } else {
            this.brushHelper.globalCompositeOperation = "xor";
            this.brushHelper.fill = "fog";
        }
        if (!gameManager.layerManager.hasLayer("fow")) {
            console.log("No fow layer!");
            return;
        }

        if (this.active) {
            this.brush.points.push(mousePos);
            socket.emit("shapeMove", { shape: this.brush.asDict(), temporary: false });
        }

        const layer = gameManager.layerManager.getLayer("fow")!;
        layer.invalidate(false);
    }
    onMouseUp(e: MouseEvent) {
        this.active = false;
    }
    onSelect() {
        if (!gameManager.layerManager.hasLayer("fow")) {
            console.log("No fow layer!");
            return;
        }
        const layer = gameManager.layerManager.getLayer("fow")!;
        layer.addShape(this.brushHelper, false, false);
    }
    onDeselect() {
        if (!gameManager.layerManager.hasLayer("fow")) {
            console.log("No fow layer!");
            return;
        }
        const layer = gameManager.layerManager.getLayer("fow")!;
        layer.removeShape(this.brushHelper, false, false);
    }
}