import { GlobalPoint, Vector } from "@/game/geom";
import { BoundingRect } from "@/game/shapes/boundingrect";
import { Shape } from "@/game/shapes/shape";
import { calculateDelta } from "@/game/ui/tools/utils";
import { clampGridLine, g2lx, g2ly } from "@/game/units";
import { ServerShape } from "../comm/types/shapes";
import { gameSettingsStore } from "../settings";

export abstract class BaseRect extends Shape {
    w: number;
    h: number;
    constructor(topleft: GlobalPoint, w: number, h: number, fillColour?: string, strokeColour?: string, uuid?: string) {
        super(topleft, fillColour, strokeColour, uuid);
        this.w = w;
        this.h = h;
    }
    getBaseDict(): ServerShape & { width: number; height: number } {
        return Object.assign(super.getBaseDict(), {
            width: this.w,
            height: this.h,
        });
    }
    getBoundingBox(): BoundingRect {
        return new BoundingRect(this.refPoint, this.w, this.h);
    }

    get points(): number[][] {
        if (this.w === 0 || this.h === 0) return [[this.refPoint.x, this.refPoint.y]];
        // note to self: topright and botleft are swapped because I'm retarded.
        const topright = this.refPoint.add(new Vector(0, this.h));
        const botright = this.refPoint.add(new Vector(this.w, this.h));
        const botleft = this.refPoint.add(new Vector(this.w, 0));
        return [
            [this.refPoint.x, this.refPoint.y],
            [topright.x, topright.y],
            [botright.x, botright.y],
            [botleft.x, botleft.y],
        ];
    }

    contains(point: GlobalPoint): boolean {
        return (
            this.refPoint.x <= point.x &&
            this.refPoint.x + this.w >= point.x &&
            this.refPoint.y <= point.y &&
            this.refPoint.y + this.h >= point.y
        );
    }
    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        if (centerPoint === undefined) return this.refPoint.add(new Vector(this.w / 2, this.h / 2));
        this.refPoint = new GlobalPoint(centerPoint.x - this.w / 2, centerPoint.y - this.h / 2);
    }

    visibleInCanvas(canvas: HTMLCanvasElement): boolean {
        if (super.visibleInCanvas(canvas)) return true;
        const coreVisible = !(
            g2lx(this.refPoint.x) > canvas.width ||
            g2ly(this.refPoint.y) > canvas.height ||
            g2lx(this.refPoint.x + this.w) < 0 ||
            g2ly(this.refPoint.y + this.h) < 0
        );
        if (coreVisible) return true;
        return false;
    }
    snapToGrid(): void {
        const gs = gameSettingsStore.gridSize;
        const center = this.center();
        const mx = center.x;
        const my = center.y;

        let targetX;
        let targetY;

        if ((this.w / gs) % 2 === 0) {
            targetX = clampGridLine(mx) - this.w / 2;
        } else {
            targetX = (Math.round((mx + gs / 2) / gs) - 1 / 2) * gs - this.w / 2;
        }
        if ((this.h / gs) % 2 === 0) {
            targetY = clampGridLine(my) - this.h / 2;
        } else {
            targetY = (Math.round((my + gs / 2) / gs) - 1 / 2) * gs - this.h / 2;
        }

        const delta = calculateDelta(new Vector(targetX - this.refPoint.x, targetY - this.refPoint.y), this);
        this.refPoint = this.refPoint.add(delta);

        this.invalidate(false);
    }
    resizeToGrid(resizePoint: number, retainAspectRatio: boolean): void {
        this.resize(
            resizePoint,
            new GlobalPoint(
                clampGridLine(this.refPoint.x + (resizePoint > 1 ? this.w : 0)),
                clampGridLine(this.refPoint.y + ([1, 2].includes(resizePoint) ? this.h : 0)),
            ),
            retainAspectRatio,
        );
    }
    resize(resizePoint: number, point: GlobalPoint, retainAspectRatio: boolean): number {
        const aspectRatio = this.w / this.h;
        const oldW = this.w;
        const oldH = this.h;

        switch (resizePoint) {
            case 0: {
                this.w += this.refPoint.x - point.x;
                this.h += this.refPoint.y - point.y;
                this.refPoint = this.refPoint.add(new Vector(oldW - this.w, oldH - this.h));
                break;
            }
            case 1: {
                this.w += this.refPoint.x - point.x;
                this.h = point.y - this.refPoint.y;
                this.refPoint = new GlobalPoint(point.x, this.refPoint.y);
                break;
            }
            case 2: {
                this.w = point.x - this.refPoint.x;
                this.h = point.y - this.refPoint.y;
                break;
            }
            case 3: {
                this.w = point.x - this.refPoint.x;
                this.h += this.refPoint.y - point.y;
                this.refPoint = new GlobalPoint(this.refPoint.x, point.y);
                break;
            }
        }

        if (this.w < 0 && this.h < 0) resizePoint += 2;
        else if (this.w < 0) resizePoint += resizePoint % 2 === 0 ? -1 : 1;
        else if (this.h < 0) resizePoint += resizePoint % 2 === 0 ? 1 : -1;

        if (this.w < 0) {
            this.refPoint = this.refPoint.add(new Vector(this.w, 0));
            this.w = Math.abs(this.w);
        }
        if (this.h < 0) {
            this.refPoint = this.refPoint.add(new Vector(0, this.h));
            this.h = Math.abs(this.h);
        }

        if (retainAspectRatio && !isNaN(aspectRatio)) {
            const tempAspectRatio = this.w / this.h;
            if (tempAspectRatio > aspectRatio) {
                if (resizePoint === 0 || resizePoint === 3) {
                    this.refPoint = new GlobalPoint(this.refPoint.x, this.refPoint.y + this.h - this.w / aspectRatio);
                }
                this.h = this.w / aspectRatio;
            } else if (tempAspectRatio < aspectRatio) {
                if (resizePoint === 0 || resizePoint === 1) {
                    this.refPoint = new GlobalPoint(this.refPoint.x + this.w - this.h * aspectRatio, this.refPoint.y);
                }
                this.w = this.h * aspectRatio;
            }
        }

        return (resizePoint + 4) % 4;
    }
}
