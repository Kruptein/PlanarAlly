import clamp from "lodash/clamp";

import { g2l, g2lx, g2ly, g2lz, getUnitDistance } from "../../core/conversions";
import { addP, cloneP, equalsP, subtractP, toArrayP, toGP } from "../../core/geometry";
import type { GlobalPoint, Vector } from "../../core/geometry";
import { rotateAroundPoint } from "../../core/math";
import { UI_SYNC } from "../../core/models/types";
import type { Sync } from "../../core/models/types";
import type { FunctionPropertyNames } from "../../core/types";
import { mostReadable } from "../../core/utils";
import { activeShapeStore } from "../../store/activeShape";
import type { ActiveShapeStore } from "../../store/activeShape";
import { clientStore } from "../../store/client";
import { floorStore } from "../../store/floor";
import { gameStore } from "../../store/game";
import {
    sendShapeAddLabel,
    sendShapeRemoveLabel,
    sendShapeSetAnnotation,
    sendShapeSetAnnotationVisible,
    sendShapeSetBlocksMovement,
    sendShapeSetBlocksVision,
    sendShapeSetDefeated,
    sendShapeSetFillColour,
    sendShapeSetInvisible,
    sendShapeSetIsToken,
    sendShapeSetLocked,
    sendShapeSetName,
    sendShapeSetNameVisible,
    sendShapeSetShowBadge,
    sendShapeSetStrokeColour,
} from "../api/emits/shape/options";
import { getBadgeCharacters } from "../groups";
import { generateLocalId, getGlobalId } from "../id";
import type { GlobalId, LocalId } from "../id";
import type { Layer } from "../layers/variants/layer";
import type { Floor, FloorId, LayerName } from "../models/floor";
import type { ServerShapeOptions } from "../models/shapes";
import type { ServerShape, ShapeOptions } from "../models/shapes";
import { accessSystem } from "../systems/access";
import { ownerToClient, ownerToServer } from "../systems/access/helpers";
import { auraSystem } from "../systems/auras";
import { aurasFromServer, aurasToServer } from "../systems/auras/conversion";
import { doorSystem } from "../systems/logic/door";
import { teleportZoneSystem } from "../systems/logic/tp";
import { trackerSystem } from "../systems/trackers";
import { trackersFromServer, trackersToServer } from "../systems/trackers/conversion";
import { TriangulationTarget, visionState } from "../vision/state";

import type { IShape, Label } from "./interfaces";
import type { SHAPE_TYPE } from "./types";
import { BoundingRect } from "./variants/boundingRect";

export abstract class Shape implements IShape {
    // Used to create class instance from server shape data
    abstract readonly type: SHAPE_TYPE;
    readonly id: LocalId;

    // The layer the shape is currently on
    protected _floor!: FloorId | undefined;
    protected _layer!: LayerName;

    // A reference point regarding that specific shape's structure
    protected _refPoint: GlobalPoint;
    protected _angle = 0;

    protected _points: [number, number][] = [];
    get points(): [number, number][] {
        return this._points;
    }
    abstract invalidatePoints(): void;

    abstract contains(point: GlobalPoint, nearbyThreshold?: number): boolean;

    abstract snapToGrid(): void;
    abstract resizeToGrid(resizePoint: number, retainAspectRatio: boolean): void;
    abstract resize(resizePoint: number, point: GlobalPoint, retainAspectRatio: boolean): number;

    // The optional name associated with the shape
    name = "Unknown shape";
    nameVisible = true;

    isToken = false;
    isInvisible = false;
    isDefeated = false;
    isLocked = false;

    // Fill colour of the shape
    fillColour: string;
    strokeColour: string[];
    strokeWidth: number;

    assetId?: number;
    groupId?: string;

    // Block vision sources
    blocksVision = false;
    // Prevent shapes from overlapping with this shape
    blocksMovement = false;

    // Draw mode to use
    globalCompositeOperation: GlobalCompositeOperation = "source-over";

    labels: Label[] = [];

    // Mouseover annotation
    annotation = "";
    annotationVisible = false;

    badge = 0;
    showBadge = false;

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

    constructor(
        refPoint: GlobalPoint,
        options?: {
            fillColour?: string;
            strokeColour?: string[];
            id?: LocalId;
            uuid?: GlobalId;
            assetId?: number;
            strokeWidth?: number;
            isSnappable?: boolean;
        },
    ) {
        this._refPoint = refPoint;
        this.id = options?.id ?? generateLocalId(this, options?.uuid);
        this.fillColour = options?.fillColour ?? "#000";
        this.strokeColour = options?.strokeColour ?? ["rgba(0,0,0,0)"];
        this.assetId = options?.assetId;
        this.strokeWidth = options?.strokeWidth ?? 5;
        this.isSnappable = options?.isSnappable ?? true;
    }

    abstract center(): GlobalPoint;
    abstract center(centerPoint: GlobalPoint): void;

    // Informs whether `points` forms a close loop
    abstract get isClosed(): boolean;

    /**
     * Returns true if this shape should trigger a vision recalculation when it moves or otherwise mutates.
     * This is the case when it is a token, has an aura that is a vision source or if it blocks vision.
     */
    get triggersVisionRecalc(): boolean {
        return this.isToken || auraSystem.getAll(this.id, true).some((a) => a.visionSource) || this.blocksMovement;
    }

    onLayerAdd(): void {}

    // POSITION

    get floor(): Floor {
        return floorStore.getFloor({ id: this._floor! })!;
    }

    get layer(): Layer {
        return floorStore.getLayer(this.floor, this._layer)!;
    }

    get refPoint(): GlobalPoint {
        return cloneP(this._refPoint);
    }
    set refPoint(point: GlobalPoint) {
        this._refPoint = point;
        this.invalidatePoints();
    }

    get angle(): number {
        return this._angle;
    }

    set angle(angle: number) {
        this._angle = angle;
        this.invalidatePoints();
        this.updateLayerPoints();
    }

    setLayer(floor: FloorId, layer: LayerName): void {
        this._floor = floor;
        this._layer = layer;
    }

    getPositionRepresentation(): { angle: number; points: [number, number][] } {
        return { angle: this.angle, points: [toArrayP(this.refPoint)] };
    }

    setPositionRepresentation(position: { angle: number; points: [number, number][] }): void {
        this._refPoint = toGP(position.points[0]);
        this.angle = position.angle;
        this.updateShapeVision(false, false);
    }

    invalidate(skipLightUpdate: boolean): void {
        this.layer.invalidate(skipLightUpdate);
    }

    updateLayerPoints(): void {
        for (const point of this.layer.points) {
            if (point[1].has(this.id)) {
                if (point[1].size === 1) this.layer.points.delete(point[0]);
                else point[1].delete(this.id);
            }
        }
        for (const point of this.points) {
            const strp = JSON.stringify(point);
            if (this.layer.points.has(strp) && !this.layer.points.get(strp)!.has(this.id))
                this.layer.points.get(strp)!.add(this.id);
            else if (!this.layer.points.has(strp)) this.layer.points.set(strp, new Set([this.id]));
        }
    }

    rotateAround(point: GlobalPoint, angle: number): void {
        const center = this.center();
        if (!equalsP(point, center)) this.center(rotateAroundPoint(center, point, angle));
        this.angle += angle;
        this.updateLayerPoints();
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
        const prev = toGP(points[(points.length + i - 1) % points.length]);
        const point = toGP(points[i]);
        const next = toGP(points[(i + 1) % points.length]);
        const vec = subtractP(next, prev);
        const mid = addP(prev, vec.multiply(0.5));
        return subtractP(point, mid).normalize();
    }

    // DRAWING

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.globalCompositeOperation !== undefined) ctx.globalCompositeOperation = this.globalCompositeOperation;
        else ctx.globalCompositeOperation = "source-over";

        const center = g2l(this.center());
        const pixelRatio = clientStore.devicePixelRatio.value;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, center.x * pixelRatio, center.y * pixelRatio);
        ctx.rotate(this.angle);
    }

    drawPost(ctx: CanvasRenderingContext2D): void {
        const pixelRatio = clientStore.devicePixelRatio.value;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        let bbox: BoundingRect | undefined;
        if (this.showBadge) {
            bbox = this.getBoundingBox();
            const location = g2l(bbox.botRight);
            const crossLength = g2lz(Math.min(bbox.w, bbox.h));
            const r = crossLength * 0.2;
            ctx.strokeStyle = "black";
            ctx.fillStyle = this.strokeColour[0];
            ctx.lineWidth = g2lz(2);
            ctx.beginPath();
            ctx.arc(location.x - r, location.y - r, r, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
            ctx.fillStyle = mostReadable(this.strokeColour[0]);

            const badgeChars = getBadgeCharacters(this);
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
        if (this.isDefeated) {
            if (bbox === undefined) bbox = this.getBoundingBox();
            const crossTL = g2l(bbox.topLeft);
            const crossBR = g2l(bbox.botRight);
            const crossLength = g2lz(Math.max(bbox.w, bbox.h));
            const r = crossLength * 0.2;
            ctx.strokeStyle = "red";
            ctx.fillStyle = this.strokeColour[0];
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
        for (const tracker of trackerSystem.getAll(this.id, false)) {
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
    }

    drawSelection(ctx: CanvasRenderingContext2D): void {
        const ogOp = this.layer.ctx.globalCompositeOperation;
        if (ogOp !== "source-over") this.layer.ctx.globalCompositeOperation = "source-over";
        const bb = this.getBoundingBox();
        ctx.beginPath();
        ctx.moveTo(g2lx(bb.points[0][0]), g2ly(bb.points[0][1]));
        for (let i = 1; i <= bb.points.length; i++) {
            const vertex = bb.points[i % bb.points.length];
            ctx.lineTo(g2lx(vertex[0]), g2ly(vertex[1]));
        }
        ctx.stroke();

        const points = this.points; // expensive call

        // Draw vertices
        for (const p of points) {
            ctx.beginPath();
            ctx.arc(g2lx(p[0]), g2ly(p[1]), 3, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw edges
        ctx.beginPath();
        ctx.moveTo(g2lx(points[0][0]), g2ly(points[0][1]));
        const j = this.isClosed ? 0 : 1;
        for (let i = 1; i <= points.length - j; i++) {
            const vertex = points[i % points.length];
            ctx.lineTo(g2lx(vertex[0]), g2ly(vertex[1]));
        }
        ctx.stroke();

        if (ogOp !== "source-over") this.layer.ctx.globalCompositeOperation = ogOp;
    }

    // VISION

    updateShapeVision(alteredMovement: boolean, alteredVision: boolean): void {
        if (this.blocksVision && !alteredVision) {
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.VISION,
                shape: this.id,
            });
            visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: this.id });
            visionState.recalculateVision(this.floor.id);
        }
        this.invalidate(true);
        floorStore.invalidateLightAllFloors();
        if (this.blocksMovement && !alteredMovement) {
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.MOVEMENT,
                shape: this.id,
            });
            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: this.id });
            visionState.recalculateMovement(this.floor.id);
        }
    }

    // BOUNDING BOX

    getAABB(delta = 0): BoundingRect {
        const points = this.points; // expensive call
        let minx = points[0][0];
        let maxx = points[0][0];
        let miny = points[0][1];
        let maxy = points[0][1];
        for (const p of points.slice(1)) {
            if (p[0] < minx) minx = p[0];
            if (p[0] > maxx) maxx = p[0];
            if (p[1] < miny) miny = p[1];
            if (p[1] > maxy) maxy = p[1];
        }
        return new BoundingRect(toGP(minx - delta, miny - delta), maxx - minx + 2 * delta, maxy - miny + 2 * delta);
    }

    getBoundingBox(delta = 0): BoundingRect {
        return this.getAABB(delta);
    }

    // STATE
    abstract asDict(): ServerShape;
    getBaseDict(): ServerShape {
        const defaultAccess = accessSystem.getDefault(this.id);
        return {
            type_: this.type,
            uuid: getGlobalId(this.id),
            x: this.refPoint.x,
            y: this.refPoint.y,
            angle: this.angle,
            floor: floorStore.getFloor({ id: this._floor! })!.name,
            layer: this._layer,
            draw_operator: this.globalCompositeOperation,
            movement_obstruction: this.blocksMovement,
            vision_obstruction: this.blocksVision,
            auras: aurasToServer(getGlobalId(this.id), auraSystem.getAll(this.id, false)),
            trackers: trackersToServer(getGlobalId(this.id), trackerSystem.getAll(this.id, false)),
            labels: this.labels,
            owners: accessSystem.getOwnersFull(this.id).map((o) => ownerToServer(o)),
            fill_colour: this.fillColour,
            stroke_colour: this.strokeColour[0],
            stroke_width: this.strokeWidth,
            name: this.name,
            name_visible: this.nameVisible,
            annotation: this.annotation,
            annotation_visible: this.annotationVisible,
            is_token: this.isToken,
            is_invisible: this.isInvisible,
            is_defeated: this.isDefeated,
            options: JSON.stringify(Object.entries(this.options)),
            badge: this.badge,
            show_badge: this.showBadge,
            is_locked: this.isLocked,
            default_edit_access: defaultAccess.edit,
            default_movement_access: defaultAccess.movement,
            default_vision_access: defaultAccess.vision,
            asset: this.assetId,
            group: this.groupId,
            ignore_zoom_size: this.ignoreZoomSize,
            is_door: doorSystem.isDoor(this.id),
            is_teleport_zone: teleportZoneSystem.isTeleportZone(this.id),
        };
    }
    fromDict(data: ServerShape): void {
        const options: Partial<ServerShapeOptions> =
            data.options === undefined ? {} : Object.fromEntries(JSON.parse(data.options));

        this._layer = data.layer;
        this._floor = floorStore.getFloor({ name: data.floor })!.id;
        this.angle = data.angle;
        this.globalCompositeOperation = data.draw_operator;
        this.blocksMovement = data.movement_obstruction;
        this.blocksVision = data.vision_obstruction;
        this.labels = data.labels;
        this.fillColour = data.fill_colour;
        this.strokeColour = [data.stroke_colour];
        this.isToken = data.is_token;
        this.isInvisible = data.is_invisible;
        this.isDefeated = data.is_defeated;
        this.nameVisible = data.name_visible;
        this.badge = data.badge;
        this.showBadge = data.show_badge;
        this.isLocked = data.is_locked;
        this.annotationVisible = data.annotation_visible;

        const defaultAccess = {
            edit: data.default_edit_access,
            vision: data.default_vision_access,
            movement: data.default_movement_access,
        };
        accessSystem.inform(this.id, {
            default: defaultAccess,
            extra: data.owners.map((owner) => ownerToClient(owner)),
        });
        auraSystem.inform(this.id, aurasFromServer(...data.auras));
        trackerSystem.inform(this.id, trackersFromServer(...data.trackers));
        doorSystem.inform(this.id, data.is_door, options.door);
        teleportZoneSystem.inform(this.id, data.is_teleport_zone, options.teleport);

        this.ignoreZoomSize = data.ignore_zoom_size;

        if (data.annotation) {
            this.annotation = data.annotation;
        }
        this.name = data.name;
        if (data.options !== undefined) this.options = options;
        if (data.asset !== undefined) this.assetId = data.asset;
        if (data.group !== undefined) this.groupId = data.group;
    }

    // UTILITY

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean {
        if (options.includeAuras) {
            for (const aura of auraSystem.getAll(this.id, true)) {
                if (aura.value > 0 || aura.dim > 0) {
                    const r = getUnitDistance(aura.value + aura.dim);
                    const center = this.center();
                    const auraArea = new BoundingRect(toGP(center.x - r, center.y - r), r * 2, r * 2);
                    if (auraArea.visibleInCanvas(max)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * This utility function is used to avoid repetitive if checks.
     * It returns a proper activeShapeStore function, if the current active shape is this shape.
     * Otherwise it returns an empty function doing nothing.
     *
     * Its primary intended use is to update the UI if the current shape is being displayed.
     *
     * @param f A funtion name that exists on ActiveShapeStore
     */
    protected _<F extends FunctionPropertyNames<ActiveShapeStore>>(f: F): ActiveShapeStore[F] {
        if (this.id === activeShapeStore.state.id)
            return activeShapeStore[f].bind(activeShapeStore) as ActiveShapeStore[F];
        return (..._: unknown[]) => {};
    }

    // GROUP

    setGroupId(groupId: string | undefined, syncTo: Sync): void {
        if (syncTo.ui) this._("setGroupId")(groupId, syncTo);

        this.groupId = groupId;
    }

    // PROPERTIES

    setName(name: string, syncTo: Sync): void {
        if (syncTo.server) sendShapeSetName({ shape: getGlobalId(this.id), value: name });
        if (syncTo.ui) this._("setName")(name, syncTo);

        this.name = name;
        // Initiative names are not always updated when renaming shapes
        // This is due to these shapes not yet being reactive
        // EventBus.$emit("Initiative.ForceUpdate");
    }

    setNameVisible(visible: boolean, syncTo: Sync): void {
        if (syncTo.server) sendShapeSetNameVisible({ shape: getGlobalId(this.id), value: visible });
        if (syncTo.ui) this._("setNameVisible")(visible, syncTo);

        this.nameVisible = visible;
    }

    setIsToken(isToken: boolean, syncTo: Sync): void {
        if (syncTo.server) sendShapeSetIsToken({ shape: getGlobalId(this.id), value: isToken });
        if (syncTo.ui) this._("setIsToken")(isToken, syncTo);

        this.isToken = isToken;
        if (accessSystem.hasAccessTo(this.id, false, { vision: true })) {
            if (this.isToken) gameStore.addOwnedToken(this.id);
            else gameStore.removeOwnedToken(this.id);
        }
        this.invalidate(false);
    }

    setInvisible(isInvisible: boolean, syncTo: Sync): void {
        if (syncTo.server) sendShapeSetInvisible({ shape: getGlobalId(this.id), value: isInvisible });
        if (syncTo.ui) this._("setIsInvisible")(isInvisible, syncTo);

        this.isInvisible = isInvisible;
        this.invalidate(!this.triggersVisionRecalc);
    }

    setStrokeColour(colour: string, syncTo: Sync): void {
        if (syncTo.server) sendShapeSetStrokeColour({ shape: getGlobalId(this.id), value: colour });
        if (syncTo.ui) this._("setStrokeColour")(colour, syncTo);

        this.strokeColour = [colour];
        this.invalidate(true);
    }

    setFillColour(colour: string, syncTo: Sync): void {
        if (syncTo.server) sendShapeSetFillColour({ shape: getGlobalId(this.id), value: colour });
        if (syncTo.ui) this._("setFillColour")(colour, syncTo);

        this.fillColour = colour;
        this.invalidate(true);
    }

    setBlocksVision(blocksVision: boolean, syncTo: Sync, recalculate = true): void {
        if (syncTo.server) sendShapeSetBlocksVision({ shape: getGlobalId(this.id), value: blocksVision });
        if (syncTo.ui) this._("setBlocksVision")(blocksVision, UI_SYNC);

        this.blocksVision = blocksVision;
        const alteredVision = this.checkVisionSources(recalculate);
        if (alteredVision && recalculate) this.invalidate(false);
    }

    setBlocksMovement(blocksMovement: boolean, syncTo: Sync, recalculate = true): boolean {
        if (syncTo.server) sendShapeSetBlocksMovement({ shape: getGlobalId(this.id), value: blocksMovement });
        if (syncTo.ui) this._("setBlocksMovement")(blocksMovement, syncTo);

        let alteredMovement = false;
        this.blocksMovement = blocksMovement;
        const movementBlockers = visionState.getBlockers(
            TriangulationTarget.MOVEMENT,
            this._floor ?? floorStore.currentFloor.value!.id,
        );
        const obstructionIndex = movementBlockers.indexOf(this.id);
        if (this.blocksMovement && obstructionIndex === -1) {
            visionState.addBlocker(
                TriangulationTarget.MOVEMENT,
                this.id,
                this._floor ?? floorStore.currentFloor.value!.id,
                recalculate,
            );
            alteredMovement = true;
        } else if (!this.blocksMovement && obstructionIndex >= 0) {
            visionState.sliceBlockers(
                TriangulationTarget.MOVEMENT,
                obstructionIndex,
                this._floor ?? floorStore.currentFloor.value!.id,
                recalculate,
            );
            alteredMovement = true;
        }

        return alteredMovement;
    }

    setShowBadge(showBadge: boolean, syncTo: Sync): void {
        if (syncTo.server) sendShapeSetShowBadge({ shape: getGlobalId(this.id), value: showBadge });
        if (syncTo.ui) this._("setShowBadge")(showBadge, syncTo);

        this.showBadge = showBadge;
        this.invalidate(!this.triggersVisionRecalc);
        // EventBus.$emit("EditDialog.Group.Update");
    }

    setDefeated(isDefeated: boolean, syncTo: Sync): void {
        if (syncTo.server) sendShapeSetDefeated({ shape: getGlobalId(this.id), value: isDefeated });
        if (syncTo.ui) this._("setIsDefeated")(isDefeated, syncTo);

        this.isDefeated = isDefeated;
        this.invalidate(!this.triggersVisionRecalc);
    }

    setLocked(isLocked: boolean, syncTo: Sync): void {
        if (syncTo.server) sendShapeSetLocked({ shape: getGlobalId(this.id), value: isLocked });
        if (syncTo.ui) this._("setLocked")(isLocked, syncTo);

        this.isLocked = isLocked;
    }

    // EXTRA

    setAnnotation(text: string, syncTo: Sync): void {
        if (syncTo.server) sendShapeSetAnnotation({ shape: getGlobalId(this.id), value: text });
        if (syncTo.ui) this._("setAnnotation")(text, syncTo);

        const hadAnnotation = this.annotation !== "";
        this.annotation = text;
        if (this.annotation !== "" && !hadAnnotation) {
            gameStore.addAnnotation(this.id);
        } else if (this.annotation === "" && hadAnnotation) {
            gameStore.removeAnnotation(this.id);
        }
    }

    setAnnotationVisible(visible: boolean, syncTo: Sync): void {
        if (syncTo.server) sendShapeSetAnnotationVisible({ shape: getGlobalId(this.id), value: visible });
        if (syncTo.ui) this._("setAnnotationVisible")(visible, syncTo);

        this.annotationVisible = visible;
    }

    addLabel(label: string, syncTo: Sync): void {
        if (syncTo.server) sendShapeAddLabel({ shape: getGlobalId(this.id), value: label });
        if (syncTo.ui) this._("addLabel")(label, syncTo);

        const l = gameStore.state.labels.get(label)!;
        this.labels.push(l);
    }

    removeLabel(label: string, syncTo: Sync): void {
        if (syncTo.server) sendShapeRemoveLabel({ shape: getGlobalId(this.id), value: label });
        if (syncTo.ui) this._("removeLabel")(label, syncTo);

        this.labels = this.labels.filter((l) => l.uuid !== label);
    }

    // Extra Utilities

    private checkVisionSources(recalculate = true): boolean {
        let alteredVision = false;
        const visionBlockers = visionState.getBlockers(
            TriangulationTarget.VISION,
            this._floor ?? floorStore.currentFloor.value!.id,
        );
        const obstructionIndex = visionBlockers.indexOf(this.id);
        if (this.blocksVision && obstructionIndex === -1) {
            visionState.addBlocker(
                TriangulationTarget.VISION,
                this.id,
                this._floor ?? floorStore.currentFloor.value!.id,
                recalculate,
            );
            alteredVision = true;
        } else if (!this.blocksVision && obstructionIndex >= 0) {
            visionState.sliceBlockers(
                TriangulationTarget.VISION,
                obstructionIndex,
                this._floor ?? floorStore.currentFloor.value!.id,
                recalculate,
            );
            alteredVision = true;
        }
        return alteredVision;
    }
}
