import { g2l, g2lz } from "../../../core/conversions";
import { addP, getDistanceToSegment, subtractP, toArrayP, toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import { equalPoints, filterEqualPoints, getPointsCenter, rotateAroundPoint } from "../../../core/math";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
import { uuidv4 } from "../../../core/utils";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { getFogColour } from "../../colour";
import type { ServerPolygon } from "../../models/shapes";
import { visionState } from "../../vision/state";
import { Shape } from "../shape";
import type { SHAPE_TYPE } from "../types";

import { BoundingRect } from "./boundingRect";

export class Polygon extends Shape {
    type: SHAPE_TYPE = "polygon";
    _vertices: GlobalPoint[] = [];
    openPolygon = false;
    lineWidth: number;

    constructor(
        startPoint: GlobalPoint,
        vertices?: GlobalPoint[],
        options?: {
            fillColour?: string;
            strokeColour?: string;
            lineWidth?: number;
            openPolygon?: boolean;
            uuid?: string;
        },
    ) {
        super(startPoint, options);
        this._vertices = vertices || [];
        this.openPolygon = options?.openPolygon ?? false;
        this.lineWidth = options?.lineWidth ?? 2;
    }

    get isClosed(): boolean {
        return !this.openPolygon;
    }

    get refPoint(): GlobalPoint {
        return this._refPoint;
    }
    set refPoint(point: GlobalPoint) {
        const delta = subtractP(point, this._refPoint);
        this._refPoint = point;
        for (let i = 0; i < this._vertices.length; i++) this._vertices[i] = addP(this._vertices[i], delta);
    }

    get vertices(): GlobalPoint[] {
        return [this._refPoint, ...this._vertices];
    }

    get uniqueVertices(): GlobalPoint[] {
        return filterEqualPoints(this.vertices);
    }

    asDict(): ServerPolygon {
        return Object.assign(this.getBaseDict(), {
            vertices: this._vertices.map((v) => toArrayP(v)),
            open_polygon: this.openPolygon,
            line_width: this.lineWidth,
        });
    }

    fromDict(data: ServerPolygon): void {
        super.fromDict(data);
        this._vertices = data.vertices.map((v) => toGP(v));
        this.openPolygon = data.open_polygon;
        this.lineWidth = data.line_width;
    }

    getBoundingBox(delta = 0): BoundingRect {
        let minx = this.vertices[0].x;
        let maxx = this.vertices[0].x;
        let miny = this.vertices[0].y;
        let maxy = this.vertices[0].y;
        for (const p of this.vertices.slice(1)) {
            if (p.x < minx) minx = p.x;
            if (p.x > maxx) maxx = p.x;
            if (p.y < miny) miny = p.y;
            if (p.y > maxy) maxy = p.y;
        }
        let bbox = new BoundingRect(toGP(minx - delta, miny - delta), maxx - minx + 2 * delta, maxy - miny + 2 * delta);
        bbox = bbox.center(rotateAroundPoint(bbox.center(), this.center(), this.angle));
        bbox.angle = this.angle;
        return bbox;
    }

    getPositionRepresentation(): { angle: number; points: [number, number][] } {
        return { angle: this.angle, points: this.vertices.map((v) => toArrayP(v)) };
    }

    setPositionRepresentation(position: { angle: number; points: [number, number][] }): void {
        this._vertices = position.points.slice(1).map((p) => toGP(p));
        super.setPositionRepresentation(position);
    }

    get points(): [number, number][] {
        const center = this.center();
        return this.vertices.map((point) => toArrayP(rotateAroundPoint(point, center, this.angle)));
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);

        const center = g2l(this.center());

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = this.ignoreZoomSize ? this.lineWidth : g2lz(this.lineWidth);

        if (this.strokeColour === "fog") ctx.strokeStyle = getFogColour();
        else ctx.strokeStyle = this.strokeColour;
        if (this.fillColour === "fog") ctx.fillStyle = getFogColour();
        else ctx.fillStyle = this.fillColour;

        ctx.beginPath();
        let localVertex = subtractP(g2l(this.vertices[0]), center);
        ctx.moveTo(localVertex.x, localVertex.y);
        for (let i = 1; i <= this.vertices.length - (this.openPolygon ? 1 : 0); i++) {
            const vertex = this.vertices[i % this.vertices.length];
            if (this.ignoreZoomSize) {
                localVertex = addP(localVertex, subtractP(vertex, this.vertices[i - 1]));
            } else {
                localVertex = subtractP(g2l(vertex), center);
            }
            ctx.lineTo(localVertex.x, localVertex.y);
        }

        if (!this.openPolygon) ctx.fill();
        ctx.stroke();
        super.drawPost(ctx);
    }

    contains(point: GlobalPoint, nearbyThreshold?: number): boolean {
        if (nearbyThreshold === undefined) nearbyThreshold = this.lineWidth;
        const bbox = this.getBoundingBox(nearbyThreshold);
        if (!bbox.contains(point)) return false;
        if (this.isClosed) return true;
        if (this.angle !== 0) point = rotateAroundPoint(point, this.center(), -this.angle);
        const vertices = this.uniqueVertices;
        for (const [i, v] of vertices.entries()) {
            const nv = vertices[(i + 1) % vertices.length];
            const { distance } = getDistanceToSegment(point, [v, nv]);
            if (distance <= nearbyThreshold) return true;
        }
        return false;
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        if (centerPoint === undefined) {
            return getPointsCenter(this.uniqueVertices);
        }
        const oldCenter = this.center();
        this.refPoint = toGP(subtractP(centerPoint, subtractP(oldCenter, this.refPoint)).asArray());
    }

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean {
        if (super.visibleInCanvas(max, options)) return true;
        return this.getBoundingBox().visibleInCanvas(max);
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    snapToGrid(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    resizeToGrid(): void {}
    resize(resizePoint: number, point: GlobalPoint): number {
        if (this.angle === 0) {
            if (resizePoint === 0) this._refPoint = point;
            else this._vertices[resizePoint - 1] = point;
        } else {
            const newPoints = this.points.map((p) => toGP(p));

            newPoints[resizePoint] = point;

            const newCenter = getPointsCenter(filterEqualPoints(newPoints));

            this._refPoint = rotateAroundPoint(newPoints[0], newCenter, -this.angle);
            for (let i = 0; i < this._vertices.length; i++) {
                this._vertices[i] = rotateAroundPoint(newPoints[i + 1], newCenter, -this.angle);
            }
        }
        return resizePoint;
    }

    // POLYGON OPERATIONS
    cutPolygon(point: GlobalPoint): void {
        let lastVertex = -1;
        let nearVertex: GlobalPoint | null = null;
        for (let i = 1; i <= this.vertices.length - (this.openPolygon ? 1 : 0); i++) {
            const prevVertex = this.vertices[i - 1];
            const vertex = this.vertices[i % this.vertices.length];

            const info = getDistanceToSegment(point, [prevVertex, vertex]);
            if (info.distance < this.lineWidth) {
                lastVertex = i - 1;
                nearVertex = info.nearest;
                break;
            }
        }
        if (lastVertex >= 0) {
            const newVertices = this.vertices.slice(lastVertex + 1);
            this._vertices = this._vertices.slice(0, lastVertex);
            this._vertices.push(nearVertex!);
            if (!this.preventSync) sendShapePositionUpdate([this], false);

            const newPolygon = new Polygon(nearVertex!, newVertices);
            const uuid = newPolygon.uuid;
            // make sure we copy over all the same properties but retain the correct uuid and vertices
            newPolygon.fromDict({ ...this.asDict(), uuid });
            newPolygon._refPoint = nearVertex!;
            newPolygon._vertices = newVertices;
            for (const tr of newPolygon._trackers) {
                tr.uuid = uuidv4();
            }
            for (const au of newPolygon._auras) {
                au.uuid = uuidv4();
            }

            this.layer.addShape(
                newPolygon,
                SyncMode.FULL_SYNC,
                this.blocksVision ? InvalidationMode.WITH_LIGHT : InvalidationMode.NORMAL,
            );
        }
    }

    addPoint(point: GlobalPoint): void {
        for (let i = 1; i <= this.vertices.length - (this.openPolygon ? 1 : 0); i++) {
            const prevVertex = this.vertices[i - 1];
            const vertex = this.vertices[i % this.vertices.length];

            const info = getDistanceToSegment(point, [prevVertex, vertex]);
            if (info.distance < this.lineWidth) {
                this._vertices.splice(i - 1, 0, info.nearest);

                if (!this.preventSync) sendShapePositionUpdate([this], false);

                this.invalidate(true);
                break;
            }
        }
    }

    removePoint(point: GlobalPoint): void {
        const pointArr = toArrayP(point);
        let invalidate = false;
        if (equalPoints(pointArr, toArrayP(this.refPoint))) {
            this._refPoint = this._vertices.splice(0, 1)[0];
            invalidate = true;
            this.invalidate(true);
        } else {
            for (const [i, v] of this._vertices.entries()) {
                if (equalPoints(pointArr, toArrayP(v))) {
                    this._vertices.splice(i, 1);
                    invalidate = true;
                    break;
                }
            }
        }

        if (invalidate) {
            if (this.blocksVision) visionState.recalculateVision(this.floor.id);
            if (this.blocksMovement) visionState.recalculateMovement(this.floor.id);
            if (!this.preventSync) sendShapePositionUpdate([this], false);

            this.invalidate(true);
        }
    }
}
