import { exportShapeData } from "..";
import type { ApiBaseRectShape, ApiShape } from "../../../apiTypes";
import { g2lx, g2ly } from "../../../core/conversions";
import { addP, cloneP, toGP, Vector } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import type { GlobalId, LocalId } from "../../../core/id";
import { rotateAroundPoint } from "../../../core/math";
import type { IShape } from "../../interfaces/shape";
import type { ServerShapeOptions } from "../../models/shapes";
import type { ShapeProperties } from "../../systems/properties/state";
import { Shape } from "../shape";

import { BoundingRect } from "./simple/boundingRect";

type ServerBaseRect = ApiShape & { width: number; height: number };

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
            assetId?: number;
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

    asDict(): ApiBaseRectShape {
        return { ...exportShapeData(this), width: this.w, height: this.h };
    }

    fromDict(data: ServerBaseRect, options: Partial<ServerShapeOptions>): void {
        super.fromDict(data, options);
        this.w = data.width;
        this.h = data.height;
    }

    getBoundingBox(): BoundingRect {
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

        const topleft = rotateAroundPoint(this.refPoint, center, this.angle);
        const botleft = rotateAroundPoint(addP(this.refPoint, new Vector(0, this.h)), center, this.angle);
        const botright = rotateAroundPoint(addP(this.refPoint, new Vector(this.w, this.h)), center, this.angle);
        const topright = rotateAroundPoint(addP(this.refPoint, new Vector(this.w, 0)), center, this.angle);
        this._points = [
            [topleft.x, topleft.y],
            [botleft.x, botleft.y],
            [botright.x, botright.y],
            [topright.x, topright.y],
        ];
    }

    contains(point: GlobalPoint): boolean {
        if (this.angle !== 0) point = rotateAroundPoint(point, this.center, -this.angle);
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
