import Shape from "./shape";
import BoundingRect from "./boundingrect";
import { g2l, l2g, g2lz } from "../units";
import { GlobalPoint, Vector } from "../geom";
import { calculateDelta } from "../ui/tools/utils";
import { getFogColour } from "../utils";
import store from "../store";
export default class Circle extends Shape {
    constructor(center, r, fill, border, uuid) {
        super(center, uuid);
        this.type = "circle";
        this.r = r || 1;
        this.fill = fill || '#000';
        this.border = border || "rgba(0, 0, 0, 0)";
    }
    ;
    asDict() {
        // const base = <ServerCircle>this.getBaseDict();
        // base.r = this.r;
        // base.border = this.border;
        // return base;
        return Object.assign(this.getBaseDict(), {
            r: this.r,
            border: this.border
        });
    }
    fromDict(data) {
        super.fromDict(data);
        this.r = data.r;
        if (data.border)
            this.border = data.border;
    }
    getBoundingBox() {
        return new BoundingRect(new GlobalPoint(this.refPoint.x - this.r, this.refPoint.y - this.r), this.r * 2, this.r * 2);
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.beginPath();
        if (this.fill === 'fog')
            ctx.fillStyle = getFogColour();
        else
            ctx.fillStyle = this.fill;
        const loc = g2l(this.refPoint);
        ctx.arc(loc.x, loc.y, g2lz(this.r), 0, 2 * Math.PI);
        ctx.fill();
        if (this.border !== "rgba(0, 0, 0, 0)") {
            ctx.beginPath();
            ctx.lineWidth = g2lz(5);
            ctx.strokeStyle = this.border;
            ctx.arc(loc.x, loc.y, g2lz(this.r), 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
    contains(point) {
        return (point.x - this.refPoint.x) ** 2 + (point.y - this.refPoint.y) ** 2 < this.r ** 2;
    }
    inCorner(point, corner) {
        return false; // TODO
    }
    getCorner(point) {
        if (this.inCorner(point, "ne"))
            return "ne";
        else if (this.inCorner(point, "nw"))
            return "nw";
        else if (this.inCorner(point, "se"))
            return "se";
        else if (this.inCorner(point, "sw"))
            return "sw";
    }
    center(centerPoint) {
        if (centerPoint === undefined)
            return this.refPoint;
        this.refPoint = centerPoint;
    }
    visibleInCanvas(canvas) { return true; } // TODO
    snapToGrid() {
        const gs = store.state.gridSize;
        let targetX, targetY;
        if ((2 * this.r / gs) % 2 === 0) {
            targetX = Math.round(this.refPoint.x / gs) * gs;
        }
        else {
            targetX = Math.round((this.refPoint.x - (gs / 2)) / gs) * gs + this.r;
        }
        if ((2 * this.r / gs) % 2 === 0) {
            targetY = Math.round(this.refPoint.y / gs) * gs;
        }
        else {
            targetY = Math.round((this.refPoint.y - (gs / 2)) / gs) * gs + this.r;
        }
        const delta = calculateDelta(new Vector(targetX - this.refPoint.x, targetY - this.refPoint.y), this);
        this.refPoint = this.refPoint.add(delta);
        this.invalidate(false);
    }
    resizeToGrid() {
        const gs = store.state.gridSize;
        this.r = Math.max(Math.round(this.r / gs) * gs, gs / 2);
        this.invalidate(false);
    }
    resize(resizedir, point) {
        const z = store.state.zoomFactor;
        const diff = l2g(point).subtract(this.refPoint);
        this.r = Math.sqrt(Math.pow(diff.length(), 2) / 2);
    }
}
//# sourceMappingURL=circle.js.map