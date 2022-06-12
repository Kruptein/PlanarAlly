import { g2l, g2lz } from "../../../core/conversions";
import { addP, getDistanceToSegment, subtractP, toArrayP, toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import { equalPoints, filterEqualPoints, getPointsCenter, rotateAroundPoint } from "../../../core/math";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
import { uuidv4 } from "../../../core/utils";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { getFogColour } from "../../colour";
import { getGlobalId } from "../../id";
import type { GlobalId, LocalId } from "../../id";
import type { ServerPolygon } from "../../models/shapes";
import type { AuraId } from "../../systems/auras/models";
import type { TrackerId } from "../../systems/trackers/models";
import { visionState } from "../../vision/state";
import { Shape } from "../shape";
import type { SHAPE_TYPE } from "../types";

import { BoundingRect } from "./boundingRect";

export class Polygon extends Shape {
    type: SHAPE_TYPE = "polygon";
    private _vertices: GlobalPoint[] = [];
    openPolygon = false;
    lineWidth: number[];

    constructor(
        startPoint: GlobalPoint,
        vertices?: GlobalPoint[],
        options?: {
            fillColour?: string;
            strokeColour?: string[];
            lineWidth?: number[];
            openPolygon?: boolean;
            id?: LocalId;
            uuid?: GlobalId;
            isSnappable?: boolean;
        },
    ) {
        super(startPoint, options);
        this._vertices = vertices || [];
        this.openPolygon = options?.openPolygon ?? false;
        this.lineWidth = options?.lineWidth ?? [2];
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
        this.invalidatePoints();
    }

    get vertices(): GlobalPoint[] {
        return [this._refPoint, ...this._vertices];
    }

    set vertices(v: GlobalPoint[]) {
        this._refPoint = v[0];
        this._vertices = v.slice(1);
        this.invalidatePoints();
    }

    get uniqueVertices(): GlobalPoint[] {
        return filterEqualPoints(this.vertices);
    }

    asDict(): ServerPolygon {
        return Object.assign(this.getBaseDict(), {
            vertices: this._vertices.map((v) => toArrayP(v)),
            open_polygon: this.openPolygon,
            line_width: this.lineWidth[0],
        });
    }

    fromDict(data: ServerPolygon): void {
        super.fromDict(data);
        this._vertices = data.vertices.map((v) => toGP(v));
        this.openPolygon = data.open_polygon;
        this.lineWidth = [data.line_width];
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

    private invalidatePoint(point: GlobalPoint, center: GlobalPoint): [number, number] {
        return toArrayP(rotateAroundPoint(point, center, this.angle));
    }

    invalidatePoints(): void {
        const center = this.center();
        this._points = this.vertices.map((point) => this.invalidatePoint(point, center));
        if (this.isSnappable) this.updateLayerPoints();
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);

        const center = g2l(this.center());

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

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

        for (const [i, c] of this.strokeColour.entries()) {
            const lw = this.lineWidth[i] ?? this.lineWidth[0];
            ctx.lineWidth = this.ignoreZoomSize ? lw : g2lz(lw);

            if (c === "fog") ctx.strokeStyle = getFogColour();
            else ctx.strokeStyle = c;
            ctx.stroke();
        }

        super.drawPost(ctx);
    }

    contains(point: GlobalPoint, nearbyThreshold?: number): boolean {
        if (nearbyThreshold === undefined) nearbyThreshold = this.lineWidth[0];
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
        this.invalidatePoints();
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
            if (info.distance < this.lineWidth[0]) {
                lastVertex = i - 1;
                nearVertex = info.nearest;
                break;
            }
        }
        if (lastVertex >= 0) {
            const newVertices = this.vertices.slice(lastVertex + 1);
            this._vertices = this._vertices.slice(0, lastVertex);
            this._vertices.push(nearVertex!);

            const newPolygon = new Polygon(nearVertex!, newVertices);
            const uuid = getGlobalId(newPolygon.id);
            // make sure we copy over all the same properties but retain the correct uuid and vertices
            const oldDict = this.asDict();
            newPolygon.fromDict({
                ...oldDict,
                uuid,
                trackers: oldDict.trackers.map((t) => ({ ...t, uuid: uuidv4() as unknown as TrackerId })),
                auras: oldDict.auras.map((a) => ({ ...a, uuid: uuidv4() as unknown as AuraId })),
            });
            newPolygon._refPoint = nearVertex!;
            newPolygon._vertices = newVertices;

            this.layer.addShape(
                newPolygon,
                SyncMode.FULL_SYNC,
                this.blocksVision ? InvalidationMode.WITH_LIGHT : InvalidationMode.NORMAL,
            );

            this.invalidatePoints();

            // Do the OG shape update AFTER sending the new polygon or there might (depending on network)
            // be a couple of frames where the new polygon is not shown and the old one is already cut
            // potentially showing hidden stuff
            if (!this.preventSync) sendShapePositionUpdate([this], false);
        }
    }

    pushPoint(point: GlobalPoint): void {
        this._vertices.push(point);
        this._points.push(this.invalidatePoint(point, this.center()));
    }

    addPoint(point: GlobalPoint): void {
        for (let i = 1; i <= this.vertices.length - (this.openPolygon ? 1 : 0); i++) {
            const prevVertex = this.vertices[i - 1];
            const vertex = this.vertices[i % this.vertices.length];

            const info = getDistanceToSegment(point, [prevVertex, vertex]);
            if (info.distance < this.lineWidth[0]) {
                this._vertices.splice(i - 1, 0, info.nearest);

                if (!this.preventSync) sendShapePositionUpdate([this], false);

                this.invalidate(true);
                break;
            }
        }
        this.invalidatePoints();
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

            this.invalidatePoints();
            this.invalidate(true);
        }
    }
}
