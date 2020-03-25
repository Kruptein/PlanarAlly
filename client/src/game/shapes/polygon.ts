import { ServerPolygon } from "../comm/types/shapes";
import { GlobalPoint } from "../geom";
import { g2lx, g2ly, g2lz } from "../units";
import { getFogColour } from "../utils";
import { BoundingRect } from "./boundingrect";
import { Shape } from "./shape";

export class Polygon extends Shape {
    type = "polygon";
    _vertices: GlobalPoint[] = [];
    openPolygon = false;
    lineWidth: number;

    constructor(
        startPoint: GlobalPoint,
        vertices?: GlobalPoint[],
        fillColour?: string,
        strokeColour?: string,
        lineWidth?: number,
        openPolygon = false,
        uuid?: string,
    ) {
        super(startPoint, fillColour, strokeColour, uuid);
        this._vertices = vertices || [];
        this.openPolygon = openPolygon;
        this.lineWidth = lineWidth || 2;
    }

    get isClosed(): boolean {
        return !this.openPolygon;
    }

    get refPoint(): GlobalPoint {
        return this._refPoint;
    }
    set refPoint(point: GlobalPoint) {
        const delta = point.subtract(this._refPoint);
        this._refPoint = point;
        for (let i = 0; i < this._vertices.length; i++) this._vertices[i] = this._vertices[i].add(delta);
    }

    get vertices(): GlobalPoint[] {
        return [this._refPoint, ...this._vertices];
    }

    asDict(): ServerPolygon {
        return Object.assign(this.getBaseDict(), {
            vertices: this._vertices.map(p => ({ x: p.x, y: p.y })),
            // eslint-disable-next-line @typescript-eslint/camelcase
            open_polygon: this.openPolygon,
            // eslint-disable-next-line @typescript-eslint/camelcase
            line_width: this.lineWidth,
        });
    }

    fromDict(data: ServerPolygon): void {
        super.fromDict(data);
        this._vertices = data.vertices.map(v => new GlobalPoint(v.x, v.y));
        this.openPolygon = data.open_polygon;
        this.lineWidth = data.line_width;
    }

    get points(): number[][] {
        return this.vertices.map(point => [point.x, point.y]);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = g2lz(this.lineWidth);

        if (this.strokeColour === "fog") ctx.strokeStyle = getFogColour();
        else ctx.strokeStyle = this.strokeColour;
        if (this.fillColour === "fog") ctx.fillStyle = getFogColour();
        else ctx.fillStyle = this.fillColour;

        ctx.beginPath();
        ctx.moveTo(g2lx(this.vertices[0].x), g2ly(this.vertices[0].y));
        for (let i = 1; i <= this.vertices.length - (this.openPolygon ? 1 : 0); i++) {
            const vertex = this.vertices[i % this.vertices.length];
            ctx.lineTo(g2lx(vertex.x), g2ly(vertex.y));
        }
        if (!this.openPolygon) ctx.fill();
        ctx.stroke();
        super.drawPost(ctx);
    }

    contains(point: GlobalPoint): boolean {
        return this.getBoundingBox().contains(point);
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(_centerPoint?: GlobalPoint): GlobalPoint | void {
        return this.getBoundingBox().center();
    }
    visibleInCanvas(canvas: HTMLCanvasElement): boolean {
        return this.getBoundingBox().visibleInCanvas(canvas);
    } // TODO
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    snapToGrid(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    resizeToGrid(): void {}
    resize(resizePoint: number, point: GlobalPoint): number {
        if (resizePoint === 0) this._refPoint = point;
        else this._vertices[resizePoint - 1] = point;
        return resizePoint;
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
