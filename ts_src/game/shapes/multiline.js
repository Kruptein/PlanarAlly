import Shape from "./shape";
import BoundingRect from "./boundingrect";
import { g2lx, g2ly, g2lz } from "../units";
import { GlobalPoint } from "../geom";
import { getFogColour } from "../utils";
export default class MultiLine extends Shape {
    constructor(startPoint, points, size, fill, uuid) {
        super(startPoint, uuid);
        this.type = "multiline";
        this.points = [];
        this.points = points || [];
        this.size = size || 3;
        this.fill = fill || '#000';
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            size: this.size,
            points: this.points.map((p) => ({ x: p.x, y: p.y })),
        });
    }
    getBoundingBox() {
        let minx = this.refPoint.x;
        let maxx = this.refPoint.y;
        let miny = this.refPoint.x;
        let maxy = this.refPoint.y;
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            if (p.x < minx)
                minx = p.x;
            if (p.x > maxx)
                maxx = p.x;
            if (p.y < miny)
                miny = p.y;
            if (p.y > maxy)
                maxy = p.y;
        }
        return new BoundingRect(new GlobalPoint(minx, miny), maxx - minx, maxy - miny);
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(g2lx(this.refPoint.x), g2ly(this.refPoint.y));
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            ctx.lineTo(g2lx(p.x), g2ly(p.y));
        }
        if (this.fill === 'fog')
            ctx.strokeStyle = getFogColour();
        else
            ctx.strokeStyle = this.fill;
        ctx.lineWidth = g2lz(this.size);
        ctx.stroke();
    }
    contains(point) {
        return this.points.includes(point);
    }
    center(centerPoint) { } // TODO
    getCorner(point) { return ""; }
    ; // TODO
    visibleInCanvas(canvas) { return true; } // TODO
}
//# sourceMappingURL=multiline.js.map