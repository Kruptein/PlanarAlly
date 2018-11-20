import store from "../../store";
import BoundingRect from "./boundingrect";
import Shape from "./shape";

import { ServerCircle } from "../comm/types/shapes";
import { GlobalPoint, LocalPoint, Vector } from "../geom";
import { calculateDelta } from "../ui/tools/utils";
import { g2l, g2lz, l2g } from "../units";
import { getFogColour } from "../utils";

export default class Circle extends Shape {
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
    fromDict(data: ServerCircle) {
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
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.beginPath();
        if (this.fillColour === "fog") ctx.fillStyle = getFogColour();
        else ctx.fillStyle = this.fillColour;
        const loc = g2l(this.refPoint);
        ctx.arc(loc.x, loc.y, g2lz(this.r), 0, 2 * Math.PI);
        ctx.fill();
        if (this.strokeColour !== "rgba(0, 0, 0, 0)") {
            ctx.beginPath();
            ctx.lineWidth = g2lz(5);
            ctx.strokeStyle = this.strokeColour;
            ctx.arc(loc.x, loc.y, g2lz(this.r), 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
    contains(point: GlobalPoint): boolean {
        return (point.x - this.refPoint.x) ** 2 + (point.y - this.refPoint.y) ** 2 < this.r ** 2;
    }
    inCorner(point: GlobalPoint, corner: string) {
        return false; // TODO
    }
    getCorner(point: GlobalPoint) {
        if (this.inCorner(point, "ne")) return "ne";
        else if (this.inCorner(point, "nw")) return "nw";
        else if (this.inCorner(point, "se")) return "se";
        else if (this.inCorner(point, "sw")) return "sw";
    }
    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        if (centerPoint === undefined) return this.refPoint;
        this.refPoint = centerPoint;
    }
    visibleInCanvas(canvas: HTMLCanvasElement): boolean {
        return true;
    } // TODO
    snapToGrid() {
        const gs = store.state.game.gridSize;
        let targetX;
        let targetY;
        if (((2 * this.r) / gs) % 2 === 0) {
            targetX = Math.round(this.refPoint.x / gs) * gs;
        } else {
            targetX = Math.round((this.refPoint.x - gs / 2) / gs) * gs + this.r;
        }
        if (((2 * this.r) / gs) % 2 === 0) {
            targetY = Math.round(this.refPoint.y / gs) * gs;
        } else {
            targetY = Math.round((this.refPoint.y - gs / 2) / gs) * gs + this.r;
        }
        const delta = calculateDelta(new Vector(targetX - this.refPoint.x, targetY - this.refPoint.y), this);
        this.refPoint = this.refPoint.add(delta);
        this.invalidate(false);
    }
    resizeToGrid() {
        const gs = store.state.game.gridSize;
        this.r = Math.max(Math.round(this.r / gs) * gs, gs / 2);
        this.invalidate(false);
    }
    resize(resizedir: string, point: LocalPoint) {
        const z = store.state.game.zoomFactor;
        const diff = l2g(point).subtract(this.refPoint);
        this.r = Math.sqrt(Math.pow(diff.length(), 2) / 2);
    }
}
