import { ServerCircle } from "@/game/comm/types/shapes";
import { GlobalPoint, Vector } from "@/game/geom";
import { BoundingRect } from "@/game/shapes/boundingrect";
import { Shape } from "@/game/shapes/shape";
import { calculateDelta } from "@/game/ui/tools/utils";
import { clampGridLine, g2l, g2lz } from "@/game/units";
import { getFogColour } from "@/game/utils";
import { gameSettingsStore } from "../settings";

export class Circle extends Shape {
    type = "circle";
    r: number;
    constructor(center: GlobalPoint, r: number, fillColour?: string, strokeColour?: string, uuid?: string) {
        super(center, fillColour, strokeColour, uuid);
        this.r = r || 1;
    }
    asDict(): ServerCircle {
        // const base = <ServerCircle>this.getBaseDict();
        // base.r = this.r;
        // base.border = this.border;
        // return base;
        return Object.assign(this.getBaseDict(), {
            radius: this.r,
        });
    }
    fromDict(data: ServerCircle): void {
        super.fromDict(data);
        this.r = data.radius;
    }
    getBoundingBox(): BoundingRect {
        return new BoundingRect(
            new GlobalPoint(this.refPoint.x - this.r, this.refPoint.y - this.r),
            this.r * 2,
            this.r * 2,
        );
    }

    get points(): number[][] {
        return this.getBoundingBox().points;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);
        ctx.beginPath();
        if (this.fillColour === "fog") ctx.fillStyle = getFogColour();
        else ctx.fillStyle = this.fillColour;
        const loc = g2l(this.refPoint);
        ctx.arc(loc.x, loc.y, g2lz(this.r), 0, 2 * Math.PI);
        ctx.fill();
        if (this.strokeColour !== "rgba(0, 0, 0, 0)") {
            const borderWidth = 5;
            ctx.beginPath();
            ctx.lineWidth = g2lz(borderWidth);
            ctx.strokeStyle = this.strokeColour;
            // Inset the border with - borderWidth / 2
            ctx.arc(loc.x, loc.y, Math.max(borderWidth / 2, g2lz(this.r - borderWidth / 2)), 0, 2 * Math.PI);
            ctx.stroke();
        }
        super.drawPost(ctx);
    }
    contains(point: GlobalPoint): boolean {
        return (point.x - this.refPoint.x) ** 2 + (point.y - this.refPoint.y) ** 2 < this.r ** 2;
    }
    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        if (centerPoint === undefined) return this.refPoint;
        this.refPoint = centerPoint;
    }
    visibleInCanvas(canvas: HTMLCanvasElement): boolean {
        return this.getBoundingBox().visibleInCanvas(canvas);
    } // TODO
    snapToGrid(): void {
        const gs = gameSettingsStore.gridSize;
        let targetX;
        let targetY;
        if (((2 * this.r) / gs) % 2 === 0) {
            targetX = clampGridLine(this.refPoint.x);
        } else {
            targetX = Math.round((this.refPoint.x - gs / 2) / gs) * gs + this.r;
        }
        if (((2 * this.r) / gs) % 2 === 0) {
            targetY = clampGridLine(this.refPoint.y);
        } else {
            targetY = Math.round((this.refPoint.y - gs / 2) / gs) * gs + this.r;
        }
        const delta = calculateDelta(new Vector(targetX - this.refPoint.x, targetY - this.refPoint.y), this);
        this.refPoint = this.refPoint.add(delta);
        this.invalidate(false);
    }
    resizeToGrid(): void {
        const gs = gameSettingsStore.gridSize;
        this.r = Math.max(clampGridLine(this.r), gs / 2);
        this.invalidate(false);
    }
    resize(resizePoint: number, point: GlobalPoint): number {
        const diff = point.subtract(this.refPoint);
        this.r = Math.sqrt(Math.pow(diff.length(), 2) / 2);
        return resizePoint;
    }
}
