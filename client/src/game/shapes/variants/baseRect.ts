import { g2lx, g2ly, l2gz } from "../../../core/conversions";
import { addP, cloneP, toGP, Vector } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import type { GlobalId, LocalId } from "../../../core/id";
import { rotateAroundPoint } from "../../../core/math";
import type { IShape } from "../../interfaces/shape";
import type { ShapeProperties } from "../../systems/properties/types";
import { Shape } from "../shape";
import type { CompactShapeCore, RectCompactCore } from "../transformations";

import { BoundingRect } from "./simple/boundingRect";

export abstract class BaseRect extends Shape implements IShape {
    private _w: number;
    private _h: number;

    constructor(
        topleft: GlobalPoint,
        w: number,
        h: number,
        options?: {
            id?: LocalId;
            uuid?: GlobalId;
            isSnappable?: boolean;
            parentId?: LocalId;
        },
        properties?: Partial<ShapeProperties>,
    ) {
        super(topleft, options, properties);
        this._w = w;
        this._h = h;
        this._center = this.__center();
    }

    get w(): number {
        return this._w;
    }

    // THIS DOES NOT UPDATE THE CENTER
    // A later call to either set refPoint or updateCenter is expected
    set w(width: number) {
        if (width > 0) {
            this._w = width;
            this.invalidatePoints();
        }
    }

    get h(): number {
        return this._h;
    }

    // THIS DOES NOT UPDATE THE CENTER
    // A later call to either set refPoint or updateCenter is expected
    set h(height: number) {
        if (height > 0) {
            this._h = height;
            this.invalidatePoints();
        }
    }

    asCompact(): RectCompactCore {
        return { width: this.w, height: this.h };
    }

    fromCompact(core: CompactShapeCore, subShape: RectCompactCore): void {
        super.fromCompact(core, subShape);
        this.w = subShape.width;
        this.h = subShape.height;
    }

    getBoundingBox(): BoundingRect {
        if (this.ignoreZoomSize) {
            const gw = l2gz(this.w);
            const gh = l2gz(this.h);
            const c = this.center;
            const bbox = new BoundingRect(toGP(c.x - gw / 2, c.y - gh / 2), gw, gh);
            bbox.angle = this.angle;
            return bbox;
        }
        const bbox = new BoundingRect(this.refPoint, this.w, this.h);
        bbox.angle = this.angle;
        return bbox;
    }

    updatePoints(): void {
        if (this.w === 0 || this.h === 0) {
            this._points = [[this.refPoint.x, this.refPoint.y]];
            return;
        }

        const center = this.center;

        let tl: GlobalPoint;
        let effW: number;
        let effH: number;
        if (this.ignoreZoomSize) {
            effW = l2gz(this.w);
            effH = l2gz(this.h);
            tl = toGP(center.x - effW / 2, center.y - effH / 2);
        } else {
            effW = this.w;
            effH = this.h;
            tl = this.refPoint;
        }

        const topleft = rotateAroundPoint(tl, center, this.angle);
        const botleft = rotateAroundPoint(addP(tl, new Vector(0, effH)), center, this.angle);
        const botright = rotateAroundPoint(addP(tl, new Vector(effW, effH)), center, this.angle);
        const topright = rotateAroundPoint(addP(tl, new Vector(effW, 0)), center, this.angle);
        this._points = [
            [topleft.x, topleft.y],
            [botleft.x, botleft.y],
            [botright.x, botright.y],
            [topright.x, topright.y],
        ];
    }

    contains(point: GlobalPoint): boolean {
        if (this.angle !== 0) point = rotateAroundPoint(point, this.center, -this.angle);
        if (this.ignoreZoomSize) {
            const hw = l2gz(this.w) / 2;
            const hh = l2gz(this.h) / 2;
            const c = this.center;
            return c.x - hw <= point.x && c.x + hw >= point.x && c.y - hh <= point.y && c.y + hh >= point.y;
        }
        return (
            this.refPoint.x <= point.x &&
            this.refPoint.x + this.w >= point.x &&
            this.refPoint.y <= point.y &&
            this.refPoint.y + this.h >= point.y
        );
    }

    __center(): GlobalPoint {
        return addP(this.refPoint, new Vector(this.w / 2, this.h / 2));
    }

    get center(): GlobalPoint {
        return this._center;
    }

    set center(centerPoint: GlobalPoint) {
        this.refPoint = toGP(centerPoint.x - this.w / 2, centerPoint.y - this.h / 2);
    }

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean {
        if (super.visibleInCanvas(max, options)) return true;
        if (this.ignoreZoomSize) {
            const cx = g2lx(this.center.x);
            const cy = g2ly(this.center.y);
            return !(cx + this.w < 0 || cx - this.w > max.w || cy + this.h < 0 || cy - this.h > max.h);
        }
        const coreVisible = !(
            g2lx(this.refPoint.x) > max.w ||
            g2ly(this.refPoint.y) > max.h ||
            g2lx(this.refPoint.x + this.w) < 0 ||
            g2ly(this.refPoint.y + this.h) < 0
        );
        if (coreVisible) return true;
        return false;
    }

    // point is expected to be the point as on the map, irregardless of rotation
    resize(resizePoint: number, point: GlobalPoint, retainAspectRatio: boolean): number {
        point = rotateAroundPoint(point, this.center, -this.angle);

        const aspectRatio = this.w / this.h;
        const oldW = this.w;
        const oldH = this.h;
        const oldPoints = this.points;

        switch (resizePoint) {
            case 0: {
                this.w += this.refPoint.x - point.x;
                this.h += this.refPoint.y - point.y;
                this.refPoint = addP(this.refPoint, new Vector(oldW - this.w, oldH - this.h));
                break;
            }
            case 1: {
                this.w += this.refPoint.x - point.x;
                this.h = point.y - this.refPoint.y;
                this.refPoint = toGP(point.x, this.refPoint.y);
                break;
            }
            case 2: {
                this.w = point.x - this.refPoint.x;
                this.h = point.y - this.refPoint.y;
                this.refPoint = cloneP(this.refPoint); // required to recalculate center!!
                break;
            }
            case 3: {
                this.w = point.x - this.refPoint.x;
                this.h += this.refPoint.y - point.y;
                this.refPoint = toGP(this.refPoint.x, point.y);
                break;
            }
        }

        if (this.w < 0 && this.h < 0) resizePoint += 2;
        else if (this.w < 0) resizePoint += resizePoint % 2 === 0 ? -1 : 1;
        else if (this.h < 0) resizePoint += resizePoint % 2 === 0 ? 1 : -1;

        if (this.w < 0) {
            this.refPoint = addP(this.refPoint, new Vector(this.w, 0));
            this.w = Math.abs(this.w);
        }
        if (this.h < 0) {
            this.refPoint = addP(this.refPoint, new Vector(0, this.h));
            this.h = Math.abs(this.h);
        }

        if (retainAspectRatio && !isNaN(aspectRatio)) {
            const tempAspectRatio = this.w / this.h;
            if (tempAspectRatio > aspectRatio) {
                if (resizePoint === 0 || resizePoint === 3) {
                    this.refPoint = toGP(this.refPoint.x, this.refPoint.y + this.h - this.w / aspectRatio);
                }
                this.h = this.w / aspectRatio;
            } else if (tempAspectRatio < aspectRatio) {
                if (resizePoint === 0 || resizePoint === 1) {
                    this.refPoint = toGP(this.refPoint.x + this.w - this.h * aspectRatio, this.refPoint.y);
                }
                this.w = this.h * aspectRatio;
            }
        }

        const newResizePoint = (resizePoint + 4) % 4;
        const oppositeNRP = (newResizePoint + 2) % 4;

        // this call needs to happen BEFORE the below code
        this.updatePoints(); // todo see if we can do this without the full updatePoints call

        const vec = Vector.fromPoints(toGP(this.points[oppositeNRP]!), toGP(oldPoints[oppositeNRP]!));
        this.refPoint = addP(this.refPoint, vec);

        return newResizePoint;
    }
}
