import { GlobalPoint, LocalPoint } from "@/game/geom";
import { BoundingRect } from "@/game/shapes/boundingrect";
import { Shape } from "@/game/shapes/shape";
import { g2lx, g2ly, g2lz, l2g } from "@/game/units";
import { getFogColour } from "@/game/utils";
import { ServerMultiLine } from "../comm/types/shapes";

export class MultiLine extends Shape {
    type = "multiline";
    _points: GlobalPoint[] = [];
    lineWidth: number;
    constructor(
        startPoint: GlobalPoint,
        points?: GlobalPoint[],
        lineWidth?: number,
        strokeColour?: string,
        uuid?: string,
    ) {
        super(startPoint, "rgba(0, 0, 0, 0)", strokeColour || "#000", uuid);
        this._points = points || [];
        this.lineWidth = lineWidth || 3;
    }

    get refPoint(): GlobalPoint {
        return this._refPoint;
    }
    set refPoint(point: GlobalPoint) {
        const delta = point.subtract(this._refPoint);
        this._refPoint = point;
        for (let i = 0; i < this._points.length; i++) this._points[i] = this._points[i].add(delta);
    }

    asDict(): ServerMultiLine {
        return Object.assign(this.getBaseDict(), {
            // eslint-disable-next-line @typescript-eslint/camelcase
            line_width: this.lineWidth,
            points: this._points.map(p => ({ x: p.x, y: p.y })),
        });
    }
    fromDict(data: ServerMultiLine): void {
        super.fromDict(data);
        this._points = data.points.map(p => new GlobalPoint(p.x, p.y));
    }
    get points(): number[][] {
        return this._points.map(point => [point.x, point.y]);
    }
    getBoundingBox(): BoundingRect {
        let minx: number = this.refPoint.x;
        let maxx: number = this.refPoint.x;
        let miny: number = this.refPoint.y;
        let maxy: number = this.refPoint.y;
        for (const p of this._points) {
            if (p.x < minx) minx = p.x;
            if (p.x > maxx) maxx = p.x;
            if (p.y < miny) miny = p.y;
            if (p.y > maxy) maxy = p.y;
        }
        return new BoundingRect(new GlobalPoint(minx, miny), maxx - minx, maxy - miny);
    }
    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(g2lx(this.refPoint.x), g2ly(this.refPoint.y));
        for (const p of this._points) ctx.lineTo(g2lx(p.x), g2ly(p.y));
        if (this.strokeColour === "fog") ctx.strokeStyle = getFogColour();
        else ctx.strokeStyle = this.strokeColour;
        ctx.lineWidth = g2lz(this.lineWidth);
        ctx.stroke();
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
    snapToGrid(): void {}
    resizeToGrid(): void {}
    resize(resizePoint: number, point: LocalPoint): void {
        if (resizePoint === 0) this._refPoint = l2g(point);
        else this._points[resizePoint - 1] = l2g(point);
    }
}
