import clamp from "lodash/clamp";

import type { ApiCoreShape, ApiShape } from "../../apiTypes";
import { g2l, g2lx, g2ly, g2lz, getUnitDistance } from "../../core/conversions";
import { addP, cloneP, equalsP, subtractP, toArrayP, toGP, Vector } from "../../core/geometry";
import type { GlobalPoint } from "../../core/geometry";
import {
    GridType,
    getCellCountFromHeight,
    getCellCountFromWidth,
    snapPointToGrid,
    snapShapeToGrid,
} from "../../core/grid";
import type { GlobalId, LocalId } from "../../core/id";
import { rotateAroundPoint } from "../../core/math";
import { mostReadable } from "../../core/utils";
import { generateLocalId, dropId } from "../id";
import type { ILayer } from "../interfaces/layer";
import type { IShape } from "../interfaces/shape";
import { LayerName } from "../models/floor";
import type { Floor, FloorId } from "../models/floor";
import type { ServerShapeOptions, ShapeOptions } from "../models/shapes";
import { accessSystem } from "../systems/access";
import { auraSystem } from "../systems/auras";
import type { CharacterId } from "../systems/characters/models";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { groupSystem } from "../systems/groups";
import { propertiesSystem } from "../systems/properties";
import { getProperties } from "../systems/properties/state";
import type { ShapeProperties } from "../systems/properties/state";
import { VisionBlock } from "../systems/properties/types";
import { locationSettingsState } from "../systems/settings/location/state";
import { playerSettingsState } from "../systems/settings/players/state";
import { trackerSystem } from "../systems/trackers";
import { TriangulationTarget, visionState } from "../vision/state";
import { computeVisibility } from "../vision/te";

import type { DepShape, SHAPE_TYPE } from "./types";
import { BoundingRect } from "./variants/simple/boundingRect";

export abstract class Shape implements IShape {
    // Used to create class instance from server shape data
    abstract readonly type: SHAPE_TYPE;
    readonly id: LocalId;

    character: CharacterId | undefined;

    _dependentShapes: DepShape[] = [];

    get dependentShapes(): readonly DepShape[] {
        return this._dependentShapes;
    }

    // The layer the shape is currently on
    floorId: FloorId | undefined;
    layerName: LayerName | undefined;

    // A reference point regarding that specific shape's structure
    protected _refPoint: GlobalPoint;
    protected _angle = 0;
    protected _center!: GlobalPoint;

    private _pointsInvalid = false;
    protected _points: [number, number][] = [];
    protected _shadowPoints: [number, number][] | undefined = undefined;
    abstract updatePoints(): void;

    // This is a (delayed) cached version of the points of the shape
    // the points are globally positioned and ROTATED so that less calculations have to be done during a draw call
    get points(): [number, number][] {
        if (this._pointsInvalid) {
            this.updatePoints();
            this._pointsInvalid = false;
        }
        return this._points;
    }

    get shadowPoints(): [number, number][] {
        return this._shadowPoints ?? this._points;
    }

    abstract contains(point: GlobalPoint, nearbyThreshold?: number): boolean;

    abstract resize(resizePoint: number, point: GlobalPoint, retainAspectRatio: boolean): number;

    strokeWidth: number;

    assetId?: number;

    // Draw mode to use
    globalCompositeOperation: GlobalCompositeOperation = "source-over";

    showHighlight = false;

    // When set to true this shape should not use g2lz converting logic for its sizing
    // This is used for things like the ruler, which should always have the same size irregardles of zoom state
    ignoreZoomSize = false;

    // Explicitly prevent any sync to the server
    preventSync = false;

    // Decides whether its points can be snapped to
    isSnappable = true;

    // Additional options for specialized uses
    options: Partial<ShapeOptions> = {};

    // All of the below is used for light&vision
    // This is all to avoid recalculating the vision polygon every frame
    private floorIteration = -1;
    private visionIteration = -1;
    private _visionPolygon: [number, number][] | undefined = undefined;
    private _visionPath: Path2D | undefined = undefined;
    _visionBbox: BoundingRect | undefined = undefined;
    // This part keeps track of shapes that are blocking light
    // AND are adjacent to the vision area this shape can see
    // this is used to provide vision into these shapes,
    // but not behind them (e.g. reveal a tree trunk, but block what's behind it)
    _lightBlockingNeighbours: LocalId[] = [];

    _parentId?: LocalId;

    constructor(
        refPoint: GlobalPoint,
        options?: {
            id?: LocalId;
            uuid?: GlobalId;
            assetId?: number;
            strokeWidth?: number;
            isSnappable?: boolean;
            parentId?: LocalId;
        },
        properties?: Partial<ShapeProperties>,
    ) {
        this._refPoint = refPoint;
        this.id = options?.id ?? generateLocalId(this, options?.uuid);
        this.assetId = options?.assetId;
        this.strokeWidth = options?.strokeWidth ?? 5;
        this.isSnappable = options?.isSnappable ?? true;
        this._parentId = options?.parentId;

        propertiesSystem.inform(this.id, properties);
    }

    abstract __center(): GlobalPoint;
    get center(): GlobalPoint {
        return this._center;
    }
    set center(centerPoint: GlobalPoint) {
        this._center = centerPoint;
        this._visionPolygon = undefined;
    }

    get parentId(): LocalId | undefined {
        return this._parentId;
    }
    set parentId(pId: LocalId) {
        this._parentId = pId;
    }

    // Informs whether `points` forms a close loop
    abstract get isClosed(): boolean;

    /**
     * Returns true if this shape should trigger a vision recalculation when it moves or otherwise mutates.
     * This is the case when it is a token, has an aura that is a vision source or if it blocks vision.
     */
    get triggersVisionRecalc(): boolean {
        const props = getProperties(this.id)!;
        return props.isToken || props.blocksMovement || auraSystem.getAll(this.id, true).some((a) => a.visionSource);
    }

    resetVisionIteration(): void {
        this.visionIteration = -1;
    }

    // todo: Currently Aura changes do not trigger this, investigate if we want to do the extra effort
    private recalcVisionBbox(): void {
        if (this._visionPolygon === undefined || this._visionPolygon.length === 0) {
            this._visionBbox = undefined;
            return;
        }

        let x = this._visionPolygon[0]![0];
        let y = this._visionPolygon[0]![1];
        let leftX = x;
        let rightX = x;
        let topY = y;
        let botY = y;
        for (const point of this._visionPolygon) {
            x = point[0];
            y = point[1];
            if (leftX > x) leftX = x;
            else if (rightX < x) rightX = x;
            if (topY > y) topY = y;
            else if (botY < y) botY = y;
        }
        this._visionBbox = new BoundingRect(toGP(leftX, topY), rightX - leftX, botY - topY).intersect(
            this.getAuraAABB({ onlyVisionSources: true }),
        );
    }

    get visionPolygon(): Path2D {
        if (this.floorId === undefined) return new Path2D();

        const floorIteration = floorState.readonly.iteration;
        const visionIteration = visionState.getVisionIteration(this.floorId);
        const visionAltered = visionIteration !== this.visionIteration;
        if (this._visionPolygon === undefined || visionAltered) {
            const { visibility, shapeHits } = computeVisibility(
                this.center,
                TriangulationTarget.VISION,
                this.floorId,
                false,
            );
            // Only the behind-blockers need to be tracked as these require extra effort
            this._lightBlockingNeighbours = shapeHits.filter(
                (s) => getProperties(s)?.blocksVision === VisionBlock.Behind,
            );
            this._visionPolygon = visibility;
            this.visionIteration = visionIteration;
            this.recalcVisionBbox();
        }
        if (this._visionPath === undefined || floorIteration != this.floorIteration || visionAltered) {
            const path = new Path2D();
            path.moveTo(g2lx(this._visionPolygon[0]![0]), g2ly(this._visionPolygon[0]![1]));
            for (const point of this._visionPolygon) path.lineTo(g2lx(point[0]), g2ly(point[1]));
            path.closePath();
            this._visionPath = path;
            this.floorIteration = floorIteration;
        }
        return this._visionPath;
    }

    onLayerAdd(): void {}

    // POSITION

    get floor(): Floor | undefined {
        if (this.floorId === undefined) return undefined;
        return floorSystem.getFloor({ id: this.floorId });
    }

    get layer(): ILayer | undefined {
        const floor = this.floor;
        if (floor === undefined || this.layerName === undefined) return undefined;
        return floorSystem.getLayer(floor, this.layerName);
    }

    get refPoint(): GlobalPoint {
        return cloneP(this._refPoint);
    }

    set refPoint(point: GlobalPoint) {
        this._refPoint = point;
        this._center = this.__center();
        this.resetVisionIteration();
        this.invalidatePoints();
        if (getProperties(this.id)?.isToken === true) {
            const floor = this.floor;
            if (floor !== undefined) floorSystem.getLayer(floor, LayerName.Draw)?.invalidate(true);
        }
    }

    get angle(): number {
        return this._angle;
    }

    set angle(angle: number) {
        this._angle = angle;
        this.invalidatePoints();
    }

    setLayer(floor: FloorId, layer: LayerName): void {
        for (const { shape } of this._dependentShapes) {
            shape.setLayer(floor, layer);
        }
        this.floorId = floor;
        this.layerName = layer;
    }

    getPositionRepresentation(): { angle: number; points: [number, number][] } {
        return { angle: this.angle, points: [toArrayP(this.refPoint)] };
    }

    setPositionRepresentation(position: { angle: number; points: [number, number][] }): void {
        if (position.points.length === 0) return;

        this._refPoint = toGP(position.points[0]!);
        this._center = this.__center();
        this.angle = position.angle;
        this.resetVisionIteration();
        this.updateShapeVision(false, false);
        if (getProperties(this.id)?.isToken === true) {
            const floor = this.floor;
            if (floor !== undefined) floorSystem.getLayer(floor, LayerName.Draw)?.invalidate(true);
        }
    }

    invalidate(skipLightUpdate: boolean): void {
        if (this.layerName !== undefined) this.layer!.invalidate(skipLightUpdate);
    }

    invalidatePoints(): void {
        this._pointsInvalid = true;
        this.layer?.updateSectors(this.id, this.getAuraAABB());
    }

    rotateAround(point: GlobalPoint, angle: number): void {
        const center = this.center;
        if (!equalsP(point, center)) this.center = rotateAroundPoint(center, point, angle);
        this.angle += angle;
    }

    rotateAroundAbsolute(point: GlobalPoint, angle: number): void {
        this.rotateAround(point, angle - this.angle);
    }

    getPointIndex(p: GlobalPoint, delta = 0): number {
        for (const [idx, point] of this.points.entries()) {
            if (Math.abs(p.x - point[0]) <= delta && Math.abs(p.y - point[1]) <= delta) return idx;
        }
        return -1;
    }

    getPointOrientation(i: number): Vector {
        const points = this.points; // this is an expensive function
        const prev = toGP(points[(points.length + i - 1) % points.length]!);
        const point = toGP(points[i]!);
        const next = toGP(points[(i + 1) % points.length]!);
        const vec = subtractP(next, prev);
        const mid = addP(prev, vec.multiply(0.5));
        return subtractP(point, mid).normalize();
    }

    getSize(gridType: GridType): number {
        const props = getProperties(this.id)!;
        if (props.size !== 0) return props.size;

        const bbox = this.getAABB();
        const s = Math.max(getCellCountFromWidth(bbox.w, gridType), getCellCountFromHeight(bbox.h, gridType));
        const cutoff = gridType === GridType.Square ? 0.25 : 0.125;
        const customRound = (n: number): number => (n % 1 >= cutoff ? Math.ceil(n) : Math.floor(n));
        return Math.max(1, customRound(s));
    }

    snapToGrid(): void {
        const props = getProperties(this.id)!;
        const gridType = locationSettingsState.raw.gridType.value;
        const size = this.getSize(gridType);

        this.center = snapShapeToGrid(this.center, gridType, size, props.oddHexOrientation);

        this.invalidate(false);
    }

    resizeToGrid(resizePoint: number, retainAspectRatio: boolean): void {
        if (resizePoint < 0) return;

        const gridType = locationSettingsState.raw.gridType.value;
        const [targetPoint] = snapPointToGrid(toGP(this.points[resizePoint]!), gridType, {
            snapDistance: Number.MAX_VALUE,
        });
        this.resize(resizePoint, targetPoint, retainAspectRatio);
    }

    // DRAWING

    /**
     * Draw the shape on the canvas.
     * This base implementation sets the transform and rotation of the canvas context.
     *
     * @param ctx
     * @param lightRevealRender
     *  This is only used for special edge cases in the light/vision calculation.
     *  If set, all fillStyle related code should be ignored,
     *  and all stroke related operations completely skipped.
     *  only the essentials to draw the contour of the shape should be drawn.
     * @param customScale
     *  This is currently only used by Asset shapes to draw them at a custom scale.
     */
    draw(
        ctx: CanvasRenderingContext2D,
        lightRevealRender: boolean,
        customScale?: { center: GlobalPoint; width: number; height: number },
    ): void {
        if (!lightRevealRender) {
            if (this.globalCompositeOperation !== undefined)
                ctx.globalCompositeOperation = this.globalCompositeOperation;
            else ctx.globalCompositeOperation = "source-over";
        }

        const center = g2l(customScale?.center ?? this.center);
        const pixelRatio = playerSettingsState.devicePixelRatio.value;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, center.x * pixelRatio, center.y * pixelRatio);
        ctx.rotate(this.angle);
    }

    /**
     * This should be called after the shape has been drawn.
     * This base implementation resets the transform and rotation of the canvas context and
     * draws a couple of basic things all shapes can have (badges/bbox/trackers/...)
     *
     * @param ctx
     * @param lightRevealRender - see `draw`, only the transform should be reset if this is true
     */
    drawPost(ctx: CanvasRenderingContext2D, lightRevealRender: boolean): void {
        const pixelRatio = playerSettingsState.devicePixelRatio.value;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        if (lightRevealRender) return;

        const props = getProperties(this.id);
        if (props === undefined) return console.error("Missing props");

        let bbox: BoundingRect | undefined;
        if (props.showBadge) {
            bbox = this.getBoundingBox();
            const location = g2l(bbox.botRight);
            const crossLength = g2lz(Math.min(bbox.w, bbox.h));
            const r = crossLength * 0.2;
            ctx.strokeStyle = "black";
            ctx.fillStyle = props.strokeColour[0]!;
            ctx.lineWidth = g2lz(2);
            ctx.beginPath();
            ctx.arc(location.x - r, location.y - r, r, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
            ctx.fillStyle = mostReadable(props.strokeColour[0]!);

            const badgeChars = groupSystem.getBadgeCharacters(this.id);
            const scalingFactor = 2.3 - 0.5 * badgeChars.length;
            ctx.font = `${scalingFactor * r}px bold Calibri, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(badgeChars, location.x - r, location.y - r + g2lz(1));
        }
        if (this.showHighlight) {
            if (bbox === undefined) bbox = this.getBoundingBox();
            ctx.strokeStyle = "red";
            ctx.strokeRect(g2lx(bbox.topLeft.x) - 5, g2ly(bbox.topLeft.y) - 5, g2lz(bbox.w) + 10, g2lz(bbox.h) + 10);
        }
        if (props.isDefeated) {
            if (bbox === undefined) bbox = this.getBoundingBox();
            const crossTL = g2l(bbox.topLeft);
            const crossBR = g2l(bbox.botRight);
            const crossLength = g2lz(Math.max(bbox.w, bbox.h));
            const r = crossLength * 0.2;
            ctx.strokeStyle = "red";
            ctx.fillStyle = props.strokeColour[0]!;
            ctx.lineWidth = r / 5;
            ctx.beginPath();
            ctx.moveTo(crossTL.x + r, crossTL.y + r);
            ctx.lineTo(crossBR.x - r, crossBR.y - r);
            ctx.moveTo(crossTL.x + r, crossBR.y - r);
            ctx.lineTo(crossBR.x - r, crossTL.y + r);
            ctx.stroke();
        }
        // Draw tracker bars
        let barOffset = 0;
        for (const tracker of trackerSystem.getAll(this.id, true)) {
            if (tracker.draw && (tracker.visible || accessSystem.hasAccessTo(this.id, false, { vision: true }))) {
                if (bbox === undefined) bbox = this.getBoundingBox();
                ctx.strokeStyle = "black";
                ctx.lineWidth = g2lz(0.5);
                const topLeft = g2l(bbox.topLeft);
                const botRight = g2l(bbox.botRight);
                const rectX = topLeft.x;
                const rectY = topLeft.y - g2lz(10 + barOffset);
                const rectWidth = botRight.x - topLeft.x; // - g2lz(10);
                const rectHeight = g2lz(5);
                const maxVal = tracker.maxvalue;
                const curVal = clamp(tracker.value, 0, tracker.maxvalue);
                ctx.beginPath();
                ctx.fillStyle = tracker.secondaryColor;
                ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
                ctx.fillStyle = tracker.primaryColor;
                ctx.fillRect(rectX, rectY, rectWidth * (curVal / maxVal), rectHeight);
                ctx.rect(rectX, rectY, rectWidth, rectHeight);
                ctx.stroke();
                barOffset += 10;
            }
        }
        if (this._dependentShapes.length > 0) {
            if (bbox === undefined) bbox = this.getBoundingBox();
            for (const dep of this._dependentShapes) {
                dep.render(ctx, bbox, dep.shape);
            }
        }
    }

    drawSelection(ctx: CanvasRenderingContext2D): void {
        const layer = this.layer;
        if (layer === undefined) return;

        const ogOp = layer.ctx.globalCompositeOperation;
        if (ogOp !== "source-over") layer.ctx.globalCompositeOperation = "source-over";
        const bb = this.getBoundingBox();
        ctx.beginPath();
        ctx.moveTo(g2lx(bb.points[0]![0]), g2ly(bb.points[0]![1]));
        for (let i = 1; i <= bb.points.length; i++) {
            const vertex = bb.points[i % bb.points.length]!;
            ctx.lineTo(g2lx(vertex[0]), g2ly(vertex[1]));
        }
        ctx.stroke();

        const points = this.points;
        if (points.length === 0) return; // can trigger mid-floor change

        // Draw vertices
        for (const p of points) {
            ctx.beginPath();
            ctx.arc(g2lx(p[0]), g2ly(p[1]), 3, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw edges
        ctx.beginPath();
        ctx.moveTo(g2lx(points[0]![0]), g2ly(points[0]![1]));
        const j = this.isClosed ? 0 : 1;
        for (let i = 1; i <= points.length - j; i++) {
            const vertex = points[i % points.length]!;
            ctx.lineTo(g2lx(vertex[0]), g2ly(vertex[1]));
        }
        ctx.stroke();

        if (ogOp !== "source-over") layer.ctx.globalCompositeOperation = ogOp;
    }

    // VISION

    updateShapeVision(alteredMovement: boolean, alteredVision: boolean): void {
        const props = getProperties(this.id)!;
        if (props.blocksVision !== VisionBlock.No && !alteredVision) {
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.VISION,
                shape: this.id,
            });
            visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: this.id });
            if (this.floorId !== undefined) visionState.recalculateVision(this.floorId);
        }
        this.invalidate(true);
        floorSystem.invalidateLightAllFloors();
        if (props.blocksMovement && !alteredMovement) {
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.MOVEMENT,
                shape: this.id,
            });
            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: this.id });
            if (this.floorId !== undefined) visionState.recalculateMovement(this.floorId);
        }
    }

    // BOUNDING BOX

    getAABB(delta = 0): BoundingRect {
        const points = this.points;
        if (points.length === 0) {
            return new BoundingRect(this.refPoint, 5, 5);
        }

        const firstPoint = points[0]!;
        let minx = firstPoint[0];
        let maxx = firstPoint[0];
        let miny = firstPoint[1];
        let maxy = firstPoint[1];
        for (const p of points.slice(1)) {
            if (p[0] < minx) minx = p[0];
            if (p[0] > maxx) maxx = p[0];
            if (p[1] < miny) miny = p[1];
            if (p[1] > maxy) maxy = p[1];
        }
        return new BoundingRect(toGP(minx - delta, miny - delta), maxx - minx + 2 * delta, maxy - miny + 2 * delta);
    }

    getAuraAABB(options?: { onlyVisionSources?: boolean }): BoundingRect {
        let aabb = this.getAABB();
        for (const aura of auraSystem.getAll(this.id, true)) {
            if ((options?.onlyVisionSources ?? false) && !aura.visionSource) continue;
            const range = getUnitDistance(aura.value + aura.dim);
            aabb = aabb.union(new BoundingRect(addP(this.refPoint, new Vector(-range, -range)), range * 2, range * 2));
        }
        return aabb;
    }

    getBoundingBox(delta = 0): BoundingRect {
        return this.getAABB(delta);
    }

    // STATE
    abstract asDict(): ApiShape;

    fromDict(data: ApiCoreShape, options: Partial<ServerShapeOptions>): void {
        this.character = data.character ?? undefined;
        this.angle = data.angle;
        this.globalCompositeOperation = data.draw_operator as GlobalCompositeOperation;

        this.ignoreZoomSize = data.ignore_zoom_size;

        if (data.options !== undefined) this.options = options;
        if (data.asset !== null) this.assetId = data.asset;
    }

    // UTILITY

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean {
        if (options.includeAuras) {
            for (const aura of auraSystem.getAll(this.id, true)) {
                if (aura.value > 0 || aura.dim > 0) {
                    const r = getUnitDistance(aura.value + aura.dim);
                    const center = this.center;
                    const auraArea = new BoundingRect(toGP(center.x - r, center.y - r), r * 2, r * 2);
                    if (auraArea.visibleInCanvas(max)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // DEPENDENT SHAPES

    addDependentShape(dep: DepShape): void {
        if (this.floorId === undefined || this.layerName === undefined) return;

        dep.shape.setLayer(this.floorId, this.layerName);
        dep.shape.parentId = this.id;

        this._dependentShapes.push(dep);

        this.invalidate(true);
    }

    removeDependentShape(shapeId: LocalId, options: { dropShapeId: boolean }): void {
        this._dependentShapes = this._dependentShapes.filter((entry) => entry.shape.id !== shapeId);
        if (options.dropShapeId) dropId(shapeId);

        this.invalidate(true);
    }

    removeDependentShapes(options: { dropShapeId: boolean }): void {
        if (options.dropShapeId) {
            for (const { shape } of this.dependentShapes) {
                dropId(shape.id);
            }
        }
        this._dependentShapes = [];
        this.invalidate(true);
    }
}
