import gameManager from "../planarally";
import socket from "../socket";
import { l2g } from "../units";
import { getMouse } from "../utils";
import { Tool } from "./tool";
import { GlobalPoint } from "../geom";
import Line from "../shapes/line";
import Text from "../shapes/text";
import Settings from "../settings";

export class RulerTool extends Tool {
    active: boolean = false;
    startPoint!: GlobalPoint;
    ruler!: Line;
    text!: Text;

    onMouseDown(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = gameManager.layerManager.getLayer("draw")!;
        this.startPoint = l2g(getMouse(e));
        this.ruler = new Line(this.startPoint, this.startPoint);
        this.text = new Text(this.startPoint.clone(), "", "bold 20px serif");
        this.ruler.owners.push(Settings.username);
        this.text.owners.push(Settings.username);
        layer.addShape(this.ruler, true, true);
        layer.addShape(this.text, true, true);
    }
    onMouseMove(e: MouseEvent) {
        if (!this.active) return;
        if (gameManager.layerManager.getLayer("draw") === undefined) {
            console.log("No draw layer!");
            return;
        }
        // Currently draw on active layer
        const layer = gameManager.layerManager.getLayer("draw")!;
        const endPoint = l2g(getMouse(e));

        this.ruler.endPoint = endPoint;
        socket.emit("shapeMove", { shape: this.ruler!.asDict(), temporary: true });

        const diffsign = Math.sign(endPoint.x - this.startPoint.x) * Math.sign(endPoint.y - this.startPoint.y);
        const xdiff = Math.abs(endPoint.x - this.startPoint.x);
        const ydiff = Math.abs(endPoint.y - this.startPoint.y);
        const label = Math.round(Math.sqrt((xdiff) ** 2 + (ydiff) ** 2) * Settings.unitSize / Settings.gridSize) + " ft";
        let angle = Math.atan2(diffsign * ydiff, xdiff);
        const xmid = Math.min(this.startPoint.x, endPoint.x) + xdiff / 2;
        const ymid = Math.min(this.startPoint.y, endPoint.y) + ydiff / 2;
        this.text.refPoint.x = xmid;
        this.text.refPoint.y = ymid;
        this.text.text = label;
        this.text.angle = angle;
        socket.emit("shapeMove", { shape: this.text.asDict(), temporary: true });
        layer.invalidate(true);
    }
    onMouseUp(e: MouseEvent) {
        if (!this.active) return;
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = false;
        const layer = gameManager.layerManager.getLayer("draw")!;
        layer.removeShape(this.ruler, true, true);
        layer.removeShape(this.text, true, true);
        layer.invalidate(true);
    }
}