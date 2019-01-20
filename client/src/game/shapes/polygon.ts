import { ServerPolygon } from "../comm/types/shapes";
import { GlobalPoint, LocalPoint } from "../geom";
import { g2lx, g2ly, g2lz, l2g } from "../units";
import { getFogColour } from "../utils";
import { BoundingRect } from "./boundingrect";
import { Shape } from "./shape";

export class Polygon extends Shape {
    type = "polygon";
    _vertices: GlobalPoint[] = [];

    constructor(
        startPoint: GlobalPoint,
        vertices: GlobalPoint[] = [],
        fillColour?: string,
        strokeColour?: string,
        uuid?: string,
    ) {
        super(startPoint, fillColour, strokeColour, uuid);
        this._vertices = vertices;
    }

    get refPoint() {
        return this._refPoint;
    }
    set refPoint(point: GlobalPoint) {
        const delta = point.subtract(this._refPoint);
        this._refPoint = point;
        for (let i = 0; i < this._vertices.length; i++) this._vertices[i] = this._vertices[i].add(delta);
    }

    get vertices() {
        return [this._refPoint, ...this._vertices];
    }

    asDict() {
        return Object.assign(this.getBaseDict(), {
            vertices: this._vertices.map(p => ({ x: p.x, y: p.y })),
        });
    }

    fromDict(data: ServerPolygon) {
        super.fromDict(data);
        this._vertices = data.vertices.map(v => new GlobalPoint(v.x, v.y));
    }

    get points() {
        return this.vertices.map(point => [point.x, point.y]);
    }

    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (this.strokeColour === "fog") ctx.strokeStyle = getFogColour();
        else if (this.vertices.length === 2) ctx.strokeStyle = this.fillColour;
        else ctx.strokeStyle = this.strokeColour;
        if (this.fillColour === "fog") ctx.fillStyle = getFogColour();
        else ctx.fillStyle = this.fillColour;
        ctx.lineWidth = g2lz(2);

        ctx.beginPath();
        ctx.moveTo(g2lx(this.vertices[0].x), g2ly(this.vertices[0].y));
        for (let i = 1; i <= this.vertices.length; i++) {
            const vertex = this.vertices[i % this.vertices.length];
            ctx.lineTo(g2lx(vertex.x), g2ly(vertex.y));
        }
        ctx.fill();
        ctx.stroke();
    }

    contains(point: GlobalPoint): boolean {
        return this.getBoundingBox().contains(point);
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        return this.getBoundingBox().center();
    }
    visibleInCanvas(canvas: HTMLCanvasElement): boolean {
        return this.getBoundingBox().visibleInCanvas(canvas);
    } // TODO
    snapToGrid(): void {}
    resizeToGrid(): void {}
    resize(resizePoint: number, point: LocalPoint): void {
        if (resizePoint === 0) this._refPoint = l2g(point);
        else this._vertices[resizePoint - 1] = l2g(point);
    }
    getBoundingBox(): BoundingRect {
        let minx: number = this.refPoint.x;
        let maxx: number = this.refPoint.x;
        let miny: number = this.refPoint.y;
        let maxy: number = this.refPoint.y;
        for (const p of this._vertices) {
            if (p.x < minx) minx = p.x;
            if (p.x > maxx) maxx = p.x;
            if (p.y < miny) miny = p.y;
            if (p.y > maxy) maxy = p.y;
        }
        return new BoundingRect(new GlobalPoint(minx, miny), maxx - minx, maxy - miny);
    }
}
