import { GlobalPoint, LocalPoint } from "@/game/geom";
import { BoundingRect } from "@/game/shapes/boundingrect";
import { Shape } from "@/game/shapes/shape";
import { g2lx, g2ly, g2lz } from "@/game/units";
import { getFogColour } from "@/game/utils";

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
    asDict() {
        return Object.assign(this.getBaseDict(), {
            line_width: this.lineWidth,
            points: this._points.map(p => ({ x: p.x, y: p.y })),
        });
    }
    get points() {
        return this._points.map(point => [point.x, point.y]);
    }
    getBoundingBox(): BoundingRect {
        let minx: number = this.refPoint.x;
        let maxx: number = this.refPoint.y;
        let miny: number = this.refPoint.x;
        let maxy: number = this.refPoint.y;
        for (const p of this._points) {
            if (p.x < minx) minx = p.x;
            if (p.x > maxx) maxx = p.x;
            if (p.y < miny) miny = p.y;
            if (p.y > maxy) maxy = p.y;
        }
        return new BoundingRect(new GlobalPoint(minx, miny), maxx - minx, maxy - miny);
    }
    draw(ctx: CanvasRenderingContext2D) {
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
        return this._points.includes(point);
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {} // TODO
    getCorner(point: GlobalPoint): string | undefined {
        return "";
    } // TODO
    visibleInCanvas(canvas: HTMLCanvasElement): boolean {
        return true;
    } // TODO
    snapToGrid(): void {}
    resizeToGrid(): void {}
    resize(resizeDir: string, point: LocalPoint): void {}
}
