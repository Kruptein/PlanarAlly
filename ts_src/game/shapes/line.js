import Shape from "./shape";
import BoundingRect from "./boundingrect";
import { g2lx, g2ly } from "../units";
import { GlobalPoint } from "../geom";
export default class Line extends Shape {
    constructor(startPoint, endPoint, lineWidth, uuid) {
        super(startPoint, uuid);
        this.type = "line";
        this.endPoint = endPoint;
        this.lineWidth = (lineWidth === undefined) ? 1 : lineWidth;
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            x2: this.endPoint.x,
            y2: this.endPoint.y,
            lineWidth: this.lineWidth,
        });
    }
    getBoundingBox() {
        return new BoundingRect(new GlobalPoint(Math.min(this.refPoint.x, this.endPoint.x), Math.min(this.refPoint.x, this.endPoint.y)), Math.abs(this.refPoint.x - this.endPoint.x), Math.abs(this.refPoint.y - this.endPoint.y));
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.beginPath();
        ctx.moveTo(g2lx(this.refPoint.x), g2ly(this.refPoint.y));
        ctx.lineTo(g2lx(this.endPoint.x), g2ly(this.endPoint.y));
        ctx.strokeStyle = 'rgba(255,0,0, 0.5)';
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();
    }
    contains(point) {
        return false; // TODO
    }
    center(centerPoint) { } // TODO
    getCorner(point) { return ""; }
    ; // TODO
    visibleInCanvas(canvas) { return true; } // TODO
}
//# sourceMappingURL=line.js.map