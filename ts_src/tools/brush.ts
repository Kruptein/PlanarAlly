import { Tool } from "./tool";
import { GlobalPoint } from "../geom";
import gameManager from "../planarally";
import { getMouse } from "../utils";
import { l2g } from "../units";
import MultiLine from "../shapes/multiline";
import { socket } from "../socket";

export class BrushTool extends Tool {
    active: boolean = false;
    startPoint!: GlobalPoint;
    brush!: MultiLine;
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
        const layer = gameManager.layerManager.getLayer("fow")!;
        this.startPoint = l2g(getMouse(e));
        this.brush = new MultiLine(this.startPoint.clone(), [], parseInt($("#brush-size").prop("value")), "fog");

        if ($("#brush-reveal").prop("checked")) {
            this.brush.globalCompositeOperation = "destination-out";
            this.brush.fill = "rgba(0, 0, 0, 1)";
        } else
            this.brush.globalCompositeOperation = "xor";
        
        layer.addShape(this.brush, true, false);
    }
    onMouseMove(e: MouseEvent) {
        if (!this.active) return;
        if (!gameManager.layerManager.hasLayer("fow")) {
            console.log("No fow layer!");
            return;
        }
        const layer = gameManager.layerManager.getLayer("fow")!;

        this.brush.points.push(l2g(getMouse(e)));

        socket.emit("shapeMove", { shape: this.brush.asDict(), temporary: false });
        layer.invalidate(false);
    }
    onMouseUp(e: MouseEvent) {
        this.active = false;
    }
}