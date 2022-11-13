import { g2l, g2lz } from "../../../core/conversions";
import { addP, getDistanceToSegment, subtractP, toArrayP, toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import { equalPoints, filterEqualPoints, getPointsCenter, rotateAroundPoint } from "../../../core/math";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
import { uuidv4 } from "../../../core/utils";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { FOG_COLOUR } from "../../colour";
import { getGlobalId } from "../../id";
import type { GlobalId, LocalId } from "../../id";
import type { ServerPolygon } from "../../models/shapes";
import type { AuraId } from "../../systems/auras/models";
import { getProperties } from "../../systems/properties/state";
import type { ShapeProperties } from "../../systems/properties/state";
import type { TrackerId } from "../../systems/trackers/models";
import { visionState } from "../../vision/state";
import { Shape } from "../shape";
import type { SHAPE_TYPE } from "../types";

import { BoundingRect } from "./simple/boundingRect";

export class Polygon extends Shape {
    type: SHAPE_TYPE = "polygon";
    private _vertices: GlobalPoint[] = [];
    openPolygon = false;
    lineWidth: number[];

    constructor(
        startPoint: GlobalPoint,
        vertices?: GlobalPoint[],
        options?: {
            lineWidth?: number[];
            openPolygon?: boolean;
            id?: LocalId;
            uuid?: GlobalId;
            isSnappable?: boolean;
        },
        properties?: Partial<ShapeProperties>,
    ) {
        super(startPoint, options, properties);
        this._vertices = vertices || [];
        this.openPolygon = options?.openPolygon ?? false;
        this._center = this.__center();
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
        this._center = this.__center();
        this.resetVisionIteration();
        this.invalidatePoints();
    }

    get vertices(): GlobalPoint[] {
        return [this._refPoint, ...this._vertices];
    }

    set vertices(v: GlobalPoint[]) {
        this._refPoint = v[0];
        this._vertices = v.slice(1);
        this._center = this.__center();
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
        bbox = bbox.centerOn(rotateAroundPoint(bbox.center, this.center, this.angle));
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
        const center = this.center;
        this._points = this.vertices.map((point) => this.invalidatePoint(point, center));
        super.invalidatePoints();
    }

    draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx);

        const center = g2l(this.center);

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const props = getProperties(this.id)!;

        if (props.fillColour === "fog") ctx.fillStyle = FOG_COLOUR;
        else ctx.fillStyle = props.fillColour;

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

        for (const [i, c] of props.strokeColour.entries()) {
            const lw = this.lineWidth[i] ?? this.lineWidth[0];
            ctx.lineWidth = this.ignoreZoomSize ? lw : g2lz(lw);

            if (c === "fog") ctx.strokeStyle = FOG_COLOUR;
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
        if (this.angle !== 0) point = rotateAroundPoint(point, this.center, -this.angle);
        const vertices = this.uniqueVertices;
        for (const [i, v] of vertices.entries()) {
            const nv = vertices[(i + 1) % vertices.length];
            const { distance } = getDistanceToSegment(point, [v, nv]);
            if (distance <= nearbyThreshold) return true;
        }
        return false;
    }

    __center(): GlobalPoint {
        return getPointsCenter(this.uniqueVertices);
    }

    get center(): GlobalPoint {
        return this._center;
    }

    set center(centerPoint: GlobalPoint) {
        this.refPoint = toGP(subtractP(centerPoint, subtractP(this.center, this.refPoint)).asArray());
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
        if (resizePoint === 0) this._refPoint = rotateAroundPoint(point, this.center, -this.angle);
        else this._vertices[resizePoint - 1] = rotateAroundPoint(point, this.center, -this.angle);
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

            const props = getProperties(this.id)!;

            this.layer.addShape(
                newPolygon,
                SyncMode.FULL_SYNC,
                props.blocksVision ? InvalidationMode.WITH_LIGHT : InvalidationMode.NORMAL,
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
        this._points.push(this.invalidatePoint(point, this.center));
        this.layer.updateSectors(this.id, this.getAuraAABB());
        if (this.isSnappable) this.updateLayerPoints();
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
            const props = getProperties(this.id)!;
            if (props.blocksVision) visionState.recalculateVision(this.floor.id);
            if (props.blocksMovement) visionState.recalculateMovement(this.floor.id);
            if (!this.preventSync) sendShapePositionUpdate([this], false);

            this.invalidatePoints();
            this.invalidate(true);
        }
    }
}
