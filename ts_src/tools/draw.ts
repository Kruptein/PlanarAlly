import socket from "../socket";
import { getMouse } from "../utils";
import gameManager from "../planarally";
import { l2g } from "../units";
import Rect from "../shapes/rect";
import { GlobalPoint } from "../geom";
import { Tool } from "./tool";
import Shape from "../shapes/shape";
import Circle from "../shapes/circle";

export class DrawTool extends Tool {
    active: boolean = false;
    startPoint!: GlobalPoint;
    shape!: Shape;
    fillColor = $("<input type='text' />");
    borderColor = $("<input type='text' />");
    shapeSelect = $("<select><option value='square'>&#xf0c8;</option><option value='circle'>&#xf111;</option></select>");
    detailDiv = $("<div>")
        .append($("<div>Fill</div>")).append(this.fillColor)
        .append($("<div>Border</div>")).append(this.borderColor)
        .append($("<div>Shape</div>")).append(this.shapeSelect)
        .append($("</div>"));

    constructor() {
        super();
        this.fillColor.spectrum({
            showInput: true,
            allowEmpty: true,
            showAlpha: true,
            color: "red"
        });
        this.borderColor.spectrum({
            showInput: true,
            allowEmpty: true,
            showAlpha: true
        });
    }
    onMouseDown(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = gameManager.layerManager.getLayer()!;
        this.startPoint = l2g(getMouse(e));
        const fillColor = this.fillColor.spectrum("get");
        const fill = fillColor === null ? tinycolor("transparent") : fillColor;
        const borderColor = this.borderColor.spectrum("get");
        const border = borderColor === null ? tinycolor("transparent") : borderColor;
        if (this.shapeSelect.val() === 'square')
            this.shape = new Rect(this.startPoint.clone(), 0, 0, fill.toRgbString(), border.toRgbString());
        else if (this.shapeSelect.val() === 'circle')
            this.shape = new Circle(this.startPoint.clone(), 0, fill.toRgbString(), border.toRgbString());
        this.shape.owners.push(gameManager.username);
        if (layer.name === 'fow') {
            this.shape.visionObstruction = true;
            this.shape.movementObstruction = true;
        }
        gameManager.lightblockers.push(this.shape.uuid);
        layer.addShape(this.shape, true, false);
    }
    onMouseMove(e: MouseEvent) {
        if (!this.active) return;
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = gameManager.layerManager.getLayer()!;
        const endPoint = l2g(getMouse(e));

        if (this.shapeSelect.val() === 'square') {
            (<Rect>this.shape).w = Math.abs(endPoint.x - this.startPoint.x);
            (<Rect>this.shape).h = Math.abs(endPoint.y - this.startPoint.y);
            this.shape.refPoint.x = Math.min(this.startPoint.x, endPoint.x);
            this.shape.refPoint.y = Math.min(this.startPoint.y, endPoint.y);
        } else if (this.shapeSelect.val() === 'circle') {
            (<Circle>this.shape).r = endPoint.subtract(this.startPoint).length();
        }
        socket.emit("shapeMove", { shape: this.shape!.asDict(), temporary: false });
        layer.invalidate(false);
    }
    onMouseUp(e: MouseEvent) {
        this.active = false;
    }
}