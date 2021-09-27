import clamp from "lodash/clamp";

import { g2l, g2lx, g2ly, g2lz, getUnitDistance } from "../../core/conversions";
import { addP, cloneP, equalsP, subtractP, toArrayP, toGP } from "../../core/geometry";
import type { GlobalPoint, Vector } from "../../core/geometry";
import { rotateAroundPoint } from "../../core/math";
import { SyncTo } from "../../core/models/types";
import type { FunctionPropertyNames, PartialBy } from "../../core/types";
import { mostReadable, uuidv4 } from "../../core/utils";
import { activeShapeStore } from "../../store/activeShape";
import type { ActiveShapeStore } from "../../store/activeShape";
import { clientStore } from "../../store/client";
import { floorStore } from "../../store/floor";
import { gameStore } from "../../store/game";
import { settingsStore } from "../../store/settings";
import {
    sendShapeAddOwner,
    sendShapeDeleteOwner,
    sendShapeUpdateDefaultOwner,
    sendShapeUpdateOwner,
} from "../api/emits/access";
import { sendShapeOptionsUpdate } from "../api/emits/shape/core";
import {
    sendShapeAddLabel,
    sendShapeCreateAura,
    sendShapeCreateTracker,
    sendShapeRemoveAura,
    sendShapeRemoveLabel,
    sendShapeRemoveTracker,
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
    sendShapeUpdateAura,
    sendShapeUpdateTracker,
} from "../api/emits/shape/options";
import { getBadgeCharacters } from "../groups";
import { compositeState } from "../layers/state";
import type { Layer } from "../layers/variants/layer";
import { aurasFromServer, aurasToServer, partialAuraToServer } from "../models/conversion/aura";
import { partialTrackerToServer, trackersFromServer, trackersToServer } from "../models/conversion/tracker";
import type { Floor, LayerName } from "../models/floor";
import { accessToServer, ownerToClient, ownerToServer } from "../models/shapes";
import type { ServerShape, ShapeOptions } from "../models/shapes";
import { initiativeStore } from "../ui/initiative/state";
import { TriangulationTarget, visionState } from "../vision/state";

import type { Aura, Label, Tracker } from "./interfaces";
import type { PartialShapeOwner, ShapeAccess, ShapeOwner } from "./owners";
import type { SHAPE_TYPE } from "./types";
import { BoundingRect } from "./variants/boundingRect";

export abstract class Shape {
    // Used to create class instance from server shape data
    abstract readonly type: SHAPE_TYPE;
    // The unique ID of this shape
    readonly uuid: string;
    // The layer the shape is currently on
    protected _floor!: number | undefined;
    protected _layer!: LayerName;

    // A reference point regarding that specific shape's structure
    protected _refPoint: GlobalPoint;
    protected _angle = 0;

    abstract get points(): [number, number][];

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
    strokeColour: string;
    strokeWidth: number;

    assetId?: number;
    groupId?: string;

    // Block vision sources
    blocksVision = false;
    // Prevent shapes from overlapping with this shape
    blocksMovement = false;

    // Draw mode to use
    globalCompositeOperation = "source-over";

    // Associated trackers/auras
    protected _trackers: Tracker[] = [];
    protected _auras: Aura[] = [];
    labels: Label[] = [];

    // Access
    defaultAccess: ShapeAccess = { vision: false, movement: false, edit: false };
    protected _owners: ShapeOwner[] = [];

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

    // Additional options for specialized uses
    options: Partial<ShapeOptions> = {};

    constructor(
        refPoint: GlobalPoint,
        options?: { fillColour?: string; strokeColour?: string; uuid?: string; assetId?: number; strokeWidth?: number },
    ) {
        this._refPoint = refPoint;
        this.uuid = options?.uuid ?? uuidv4();
        this.fillColour = options?.fillColour ?? "#000";
        this.strokeColour = options?.strokeColour ?? "rgba(0,0,0,0)";
        this.assetId = options?.assetId;
        this.strokeWidth = options?.strokeWidth ?? 5;
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
        return this.isToken || this.getAuras(true).some((a) => a.visionSource) || this.blocksMovement;
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
    }

    get angle(): number {
        return this._angle;
    }

    set angle(angle: number) {
        this._angle = angle;
        this.updatePoints();
    }

    setLayer(floor: number, layer: LayerName): void {
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

    updatePoints(): void {
        for (const point of this.layer.points) {
            if (point[1].has(this.uuid)) {
                if (point[1].size === 1) this.layer.points.delete(point[0]);
                else point[1].delete(this.uuid);
            }
        }
        for (const point of this.points) {
            const strp = JSON.stringify(point);
            if (this.layer.points.has(strp) && !this.layer.points.get(strp)!.has(this.uuid))
                this.layer.points.get(strp)!.add(this.uuid);
            else if (!this.layer.points.has(strp)) this.layer.points.set(strp, new Set([this.uuid]));
        }
    }

    rotateAround(point: GlobalPoint, angle: number): void {
        const center = this.center();
        if (!equalsP(point, center)) this.center(rotateAroundPoint(center, point, angle));
        this.angle += angle;
        this.updatePoints();
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
        const prev = toGP(this.points[(this.points.length + i - 1) % this.points.length]);
        const point = toGP(this.points[i]);
        const next = toGP(this.points[(i + 1) % this.points.length]);
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
            const r = g2lz(10);
            ctx.strokeStyle = "black";
            ctx.fillStyle = this.strokeColour;
            ctx.lineWidth = g2lz(2);
            ctx.beginPath();
            ctx.arc(location.x - r, location.y - r, r, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
            ctx.fillStyle = mostReadable(this.strokeColour);

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
            const r = g2lz(10);
            ctx.strokeStyle = "red";
            ctx.fillStyle = this.strokeColour;
            ctx.lineWidth = g2lz(2);
            ctx.beginPath();
            ctx.moveTo(crossTL.x + r, crossTL.y + r);
            ctx.lineTo(crossBR.x - r, crossBR.y - r);
            ctx.moveTo(crossTL.x + r, crossBR.y - r);
            ctx.lineTo(crossBR.x - r, crossTL.y + r);
            ctx.stroke();
        }
        // Draw tracker bars
        let barOffset = 0;
        for (const tracker of this._trackers) {
            if (tracker.draw && (tracker.visible || this.ownedBy(false, { visionAccess: true }))) {
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
        const bb = this.getBoundingBox();
        ctx.beginPath();
        ctx.moveTo(g2lx(bb.points[0][0]), g2ly(bb.points[0][1]));
        for (let i = 1; i <= bb.points.length; i++) {
            const vertex = bb.points[i % bb.points.length];
            ctx.lineTo(g2lx(vertex[0]), g2ly(vertex[1]));
        }
        ctx.stroke();

        // Draw vertices
        for (const p of this.points) {
            ctx.beginPath();
            ctx.arc(g2lx(p[0]), g2ly(p[1]), 3, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw edges
        ctx.beginPath();
        ctx.moveTo(g2lx(this.points[0][0]), g2ly(this.points[0][1]));
        const j = this.isClosed ? 0 : 1;
        for (let i = 1; i <= this.points.length - j; i++) {
            const vertex = this.points[i % this.points.length];
            ctx.lineTo(g2lx(vertex[0]), g2ly(vertex[1]));
        }
        ctx.stroke();
    }

    // VISION

    updateShapeVision(alteredMovement: boolean, alteredVision: boolean): void {
        if (this.blocksVision && !alteredVision) {
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.VISION,
                shape: this.uuid,
            });
            visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: this.uuid });
            visionState.recalculateVision(this.floor.id);
        }
        this.invalidate(false);
        floorStore.invalidateLightAllFloors();
        if (this.blocksMovement && !alteredMovement) {
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.MOVEMENT,
                shape: this.uuid,
            });
            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: this.uuid });
            visionState.recalculateMovement(this.floor.id);
        }
    }

    // BOUNDING BOX

    getAABB(delta = 0): BoundingRect {
        let minx = this.points[0][0];
        let maxx = this.points[0][0];
        let miny = this.points[0][1];
        let maxy = this.points[0][1];
        for (const p of this.points.slice(1)) {
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
        return {
            type_: this.type,
            uuid: this.uuid,
            x: this.refPoint.x,
            y: this.refPoint.y,
            angle: this.angle,
            floor: floorStore.getFloor({ id: this._floor! })!.name,
            layer: this._layer,
            draw_operator: this.globalCompositeOperation,
            movement_obstruction: this.blocksMovement,
            vision_obstruction: this.blocksVision,
            auras: aurasToServer(this.uuid, this._auras),
            trackers: trackersToServer(this.uuid, this._trackers),
            labels: this.labels,
            owners: this._owners.map((owner) => ownerToServer(owner)),
            fill_colour: this.fillColour,
            stroke_colour: this.strokeColour,
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
            default_edit_access: this.defaultAccess.edit,
            default_movement_access: this.defaultAccess.movement,
            default_vision_access: this.defaultAccess.vision,
            asset: this.assetId,
            group: this.groupId,
            ignore_zoom_size: this.ignoreZoomSize,
        };
    }
    fromDict(data: ServerShape): void {
        this._layer = data.layer;
        this._floor = floorStore.getFloor({ name: data.floor })!.id;
        this.angle = data.angle;
        this.globalCompositeOperation = data.draw_operator;
        this.blocksMovement = data.movement_obstruction;
        this.blocksVision = data.vision_obstruction;
        this._auras = aurasFromServer(...data.auras);
        this._trackers = trackersFromServer(...data.trackers);
        this.labels = data.labels;
        this._owners = data.owners.map((owner) => ownerToClient(owner));
        this.fillColour = data.fill_colour;
        this.strokeColour = data.stroke_colour;
        this.isToken = data.is_token;
        this.isInvisible = data.is_invisible;
        this.isDefeated = data.is_defeated;
        this.nameVisible = data.name_visible;
        this.badge = data.badge;
        this.showBadge = data.show_badge;
        this.isLocked = data.is_locked;
        this.annotationVisible = data.annotation_visible;

        this.ignoreZoomSize = data.ignore_zoom_size;

        if (data.annotation) {
            this.annotation = data.annotation;
        }
        this.name = data.name;
        if (data.options !== undefined) this.options = Object.fromEntries(JSON.parse(data.options));
        if (data.asset !== undefined) this.assetId = data.asset;
        if (data.group !== undefined) this.groupId = data.group;
        // retain reactivity
        this.updateDefaultOwner(
            {
                edit: data.default_edit_access,
                vision: data.default_vision_access,
                movement: data.default_movement_access,
            },
            SyncTo.UI,
        );
    }

    // UTILITY

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean {
        if (options.includeAuras) {
            for (const aura of this.getAuras(true)) {
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
        if (this.uuid === activeShapeStore.state.uuid)
            return activeShapeStore[f].bind(activeShapeStore) as ActiveShapeStore[F];
        return (..._: unknown[]) => {};
    }

    // GROUP

    setGroupId(groupId: string | undefined, syncTo: SyncTo): void {
        if (syncTo === SyncTo.UI) this._("setGroupId")(groupId, syncTo);

        this.groupId = groupId;
    }

    // PROPERTIES

    setName(name: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetName({ shape: this.uuid, value: name });
        if (syncTo === SyncTo.UI) this._("setName")(name, syncTo);

        this.name = name;
        // Initiative names are not always updated when renaming shapes
        // This is due to these shapes not yet being reactive
        // EventBus.$emit("Initiative.ForceUpdate");
    }

    setNameVisible(visible: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetNameVisible({ shape: this.uuid, value: visible });
        if (syncTo === SyncTo.UI) this._("setNameVisible")(visible, syncTo);

        this.nameVisible = visible;
    }

    setIsToken(isToken: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetIsToken({ shape: this.uuid, value: isToken });
        if (syncTo === SyncTo.UI) this._("setIsToken")(isToken, syncTo);

        this.isToken = isToken;
        if (this.ownedBy(false, { visionAccess: true })) {
            if (this.isToken) gameStore.addOwnedToken(this.uuid);
            else gameStore.removeOwnedToken(this.uuid);
        }
        this.invalidate(false);
    }

    setInvisible(isInvisible: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetInvisible({ shape: this.uuid, value: isInvisible });
        if (syncTo === SyncTo.UI) this._("setIsInvisible")(isInvisible, syncTo);

        this.isInvisible = isInvisible;
        this.invalidate(!this.triggersVisionRecalc);
    }

    setStrokeColour(colour: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetStrokeColour({ shape: this.uuid, value: colour });
        if (syncTo === SyncTo.UI) this._("setStrokeColour")(colour, syncTo);

        this.strokeColour = colour;
        this.invalidate(true);
    }

    setFillColour(colour: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetFillColour({ shape: this.uuid, value: colour });
        if (syncTo === SyncTo.UI) this._("setFillColour")(colour, syncTo);

        this.fillColour = colour;
        this.invalidate(true);
    }

    setBlocksVision(blocksVision: boolean, syncTo: SyncTo, recalculate = true): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetBlocksVision({ shape: this.uuid, value: blocksVision });
        if (syncTo === SyncTo.UI) this._("setBlocksVision")(blocksVision, syncTo);

        this.blocksVision = blocksVision;
        const alteredVision = this.checkVisionSources(recalculate);
        if (alteredVision && recalculate) this.invalidate(false);
    }

    setBlocksMovement(blocksMovement: boolean, syncTo: SyncTo, recalculate = true): boolean {
        if (syncTo === SyncTo.SERVER) sendShapeSetBlocksMovement({ shape: this.uuid, value: blocksMovement });
        if (syncTo === SyncTo.UI) this._("setBlocksMovement")(blocksMovement, syncTo);

        let alteredMovement = false;
        this.blocksMovement = blocksMovement;
        const movementBlockers = visionState.getBlockers(
            TriangulationTarget.MOVEMENT,
            this._floor ?? floorStore.currentFloor.value!.id,
        );
        const obstructionIndex = movementBlockers.indexOf(this.uuid);
        if (this.blocksMovement && obstructionIndex === -1) {
            visionState.addBlocker(
                TriangulationTarget.MOVEMENT,
                this.uuid,
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

    setShowBadge(showBadge: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetShowBadge({ shape: this.uuid, value: showBadge });
        if (syncTo === SyncTo.UI) this._("setShowBadge")(showBadge, syncTo);

        this.showBadge = showBadge;
        this.invalidate(!this.triggersVisionRecalc);
        // EventBus.$emit("EditDialog.Group.Update");
    }

    setDefeated(isDefeated: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetDefeated({ shape: this.uuid, value: isDefeated });
        if (syncTo === SyncTo.UI) this._("setIsDefeated")(isDefeated, syncTo);

        this.isDefeated = isDefeated;
        this.invalidate(!this.triggersVisionRecalc);
    }

    setLocked(isLocked: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetLocked({ shape: this.uuid, value: isLocked });
        if (syncTo === SyncTo.UI) this._("setLocked")(isLocked, syncTo);

        this.isLocked = isLocked;
    }

    // OPTIONS

    setOptions(options: Partial<ShapeOptions>, syncTo: SyncTo): void {
        this.options = options;

        if (syncTo === SyncTo.SERVER) sendShapeOptionsUpdate([this], false);
        if (syncTo === SyncTo.UI) this._("setOptions")(this.options, syncTo);
    }

    // ACCESS

    get owners(): readonly ShapeOwner[] {
        return this._owners;
    }

    /**
     * This function returns true if the active user owns the given shape in the provided settings.
     * This always returns true for the DM, or for the DM faking the specific token.
     * For regular players the default rights and the personal rights are checked.
     *
     * @param limitToActiveTokens If this is set to true, everything not in the activeTokens store will always return false
     * @param options The requested rights to be checked
     */
    ownedBy(
        limitToActiveTokens: boolean,
        options: Partial<{ editAccess: boolean; visionAccess: boolean; movementAccess: boolean }>,
    ): boolean {
        const state = gameStore.state;
        if (state.isDm) return true;

        const isActiveToken = gameStore.activeTokens.value.has(this.uuid);

        if (this.isToken && limitToActiveTokens && !isActiveToken) return false;

        return (
            state.isFakePlayer ||
            ((options.editAccess ?? false) && this.defaultAccess.edit) ||
            ((options.movementAccess ?? false) && this.defaultAccess.movement) ||
            ((options.visionAccess ?? false) && this.defaultAccess.vision) ||
            this._owners.some(
                (u) =>
                    u.user === clientStore.state.username &&
                    (options.editAccess ?? false ? u.access.edit === true : true) &&
                    (options.movementAccess ?? false ? u.access.movement === true : true) &&
                    (options.visionAccess ?? false ? u.access.vision === true : true),
            )
        );
    }

    updateDefaultOwner(access: ShapeAccess, syncTo: SyncTo): void {
        if (!this.defaultAccess.edit && access.edit) {
            // Force other permissions to true if edit access is granted
            access.movement = true;
            access.vision = true;
        }
        if (this.defaultAccess.edit && (!access.vision || !access.movement)) {
            // Force remove edit permission if a specific permission is toggled off
            access.edit = false;
        }
        this.defaultAccess = access;

        if (syncTo === SyncTo.SERVER)
            sendShapeUpdateDefaultOwner({ ...accessToServer(this.defaultAccess), shape: this.uuid });
        if (syncTo === SyncTo.UI) this._("setDefaultAccess")(this.defaultAccess, syncTo);

        if (this.defaultAccess.vision) {
            if (this.ownedBy(false, { visionAccess: true })) gameStore.addOwnedToken(this.uuid);
        } else {
            if (!this.ownedBy(false, { visionAccess: true })) gameStore.removeOwnedToken(this.uuid);
        }
        if (settingsStore.fowLos.value) floorStore.invalidateLightAllFloors();
        initiativeStore._forceUpdate();
    }

    hasOwner(username: string): boolean {
        return this._owners.some((u) => u.user === username);
    }

    addOwner(owner: PartialBy<PartialShapeOwner, "shape">, syncTo: SyncTo): void {
        // Force other permissions to true if edit access is granted
        if (owner.access.edit ?? false) {
            owner.access.movement = true;
            owner.access.vision = true;
        }
        const fullOwner: ShapeOwner = {
            shape: this.uuid,
            ...owner,
            access: { edit: false, vision: false, movement: false, ...owner.access },
        };
        if (fullOwner.shape !== this.uuid) return;
        if (!this.hasOwner(owner.user)) {
            if (syncTo === SyncTo.SERVER) sendShapeAddOwner(ownerToServer(fullOwner));
            if (syncTo === SyncTo.UI) this._("addOwner")(fullOwner, syncTo);

            this._owners.push(fullOwner);
            if ((owner.access.vision ?? false) && this.isToken && owner.user === clientStore.state.username)
                gameStore.addOwnedToken(this.uuid);
            if (settingsStore.fowLos.value) floorStore.invalidateLightAllFloors();
        }
        initiativeStore._forceUpdate();
    }

    updateOwner(owner: PartialBy<ShapeOwner, "shape">, syncTo: SyncTo): void {
        const fullOwner: ShapeOwner = { shape: this.uuid, ...owner };
        if (fullOwner.shape !== this.uuid) return;
        if (!this.hasOwner(owner.user)) return;

        const targetOwner = this._owners.find((o) => o.user === owner.user)!;
        if (!targetOwner.access.edit && fullOwner.access.edit) {
            // Force other permissions to true if edit access is granted
            fullOwner.access.movement = true;
            fullOwner.access.vision = true;
        }
        if (targetOwner.access.edit && Object.values(fullOwner.access).some((a: boolean) => !a)) {
            // Force remove edit permission if a specific permission is toggled off
            fullOwner.access.edit = false;
        }

        if (syncTo === SyncTo.SERVER) sendShapeUpdateOwner(ownerToServer(fullOwner));
        if (syncTo === SyncTo.UI) this._("updateOwner")(fullOwner, syncTo);

        if (targetOwner.access.vision !== fullOwner.access.vision) {
            if (targetOwner.user === clientStore.state.username) {
                if (fullOwner.access.vision) {
                    gameStore.addOwnedToken(this.uuid);
                } else {
                    gameStore.removeOwnedToken(this.uuid);
                }
            }
        }
        targetOwner.access = fullOwner.access;
        if (settingsStore.fowLos.value) floorStore.invalidateLightAllFloors();
        initiativeStore._forceUpdate();
    }

    removeOwner(owner: string, syncTo: SyncTo): void {
        const ownerIndex = this._owners.findIndex((o) => o.user === owner);
        if (ownerIndex < 0) return;
        const removed = this._owners.splice(ownerIndex, 1)[0];

        if (syncTo === SyncTo.SERVER) sendShapeDeleteOwner(ownerToServer(removed));
        if (syncTo === SyncTo.UI) this._("removeOwner")(owner, syncTo);

        if (owner === clientStore.state.username) {
            gameStore.removeOwnedToken(owner);
        }
        if (settingsStore.fowLos.value) floorStore.invalidateLightAllFloors();
        initiativeStore._forceUpdate();
    }

    // TRACKERS

    getTrackers(includeParent: boolean): readonly Tracker[] {
        const tr: Tracker[] = [];
        if (includeParent) {
            const parent = compositeState.getCompositeParent(this.uuid);
            if (parent !== undefined) {
                tr.push(...parent.getTrackers(false));
            }
        }
        tr.push(...this._trackers);
        return tr;
    }

    pushTracker(tracker: Tracker, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeCreateTracker(trackersToServer(this.uuid, [tracker])[0]);
        else if (syncTo === SyncTo.UI) this._("pushTracker")(tracker, this.uuid, syncTo);

        this._trackers.push(tracker);
        this.invalidate(false);
    }

    updateTracker(trackerId: string, delta: Partial<Tracker>, syncTo: SyncTo): void {
        const tracker = this._trackers.find((t) => t.uuid === trackerId);
        if (tracker === undefined) return;

        if (syncTo === SyncTo.SERVER) {
            sendShapeUpdateTracker({
                ...partialTrackerToServer({
                    ...delta,
                }),
                shape: this.uuid,
                uuid: trackerId,
            });
        } else if (syncTo === SyncTo.UI) {
            this._("updateTracker")(trackerId, delta, syncTo);
        }

        Object.assign(tracker, delta);
        this.invalidate(false);
    }

    removeTracker(tracker: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeRemoveTracker({ shape: this.uuid, value: tracker });
        else if (syncTo === SyncTo.UI) this._("removeTracker")(tracker, syncTo);

        this._trackers = this._trackers.filter((tr) => tr.uuid !== tracker);
        this.invalidate(false);
    }

    // AURAS

    getAuras(includeParent: boolean): readonly Aura[] {
        const au: Aura[] = [];
        if (includeParent) {
            const parent = compositeState.getCompositeParent(this.uuid);
            if (parent !== undefined) {
                au.push(...parent.getAuras(false));
            }
        }
        au.push(...this._auras);
        return au;
    }

    pushAura(aura: Aura, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeCreateAura(aurasToServer(this.uuid, [aura])[0]);
        else if (syncTo === SyncTo.UI) this._("pushAura")(aura, this.uuid, syncTo);

        this._auras.push(aura);
        this.checkVisionSources();
        this.invalidate(false);
    }

    updateAura(auraId: string, delta: Partial<Aura>, syncTo: SyncTo): void {
        const aura = this._auras.find((t) => t.uuid === auraId);
        if (aura === undefined) return;

        if (syncTo === SyncTo.SERVER) {
            sendShapeUpdateAura({
                ...partialAuraToServer({
                    ...delta,
                }),
                shape: this.uuid,
                uuid: auraId,
            });
        } else if (syncTo === SyncTo.UI) {
            this._("updateAura")(auraId, delta, syncTo);
        }

        const visionSources = visionState.getVisionSources(this.floor.id);
        const i = visionSources.findIndex((ls) => ls.aura === aura.uuid);

        Object.assign(aura, delta);

        const showsVision = aura.active && aura.visionSource;

        if (showsVision && i === -1) visionState.addVisionSource({ shape: this.uuid, aura: aura.uuid }, this.floor.id);
        else if (!showsVision && i >= 0) visionState.sliceVisionSources(i, this.floor.id);

        this.invalidate(false);
    }

    removeAura(aura: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeRemoveAura({ shape: this.uuid, value: aura });
        else if (syncTo === SyncTo.UI) this._("removeAura")(aura, syncTo);

        this._auras = this._auras.filter((au) => au.uuid !== aura);
        this.checkVisionSources();
        this.invalidate(false);
    }

    // EXTRA

    setAnnotation(text: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetAnnotation({ shape: this.uuid, value: text });
        if (syncTo === SyncTo.UI) this._("setAnnotation")(text, syncTo);

        const hadAnnotation = this.annotation !== "";
        this.annotation = text;
        if (this.annotation !== "" && !hadAnnotation) {
            gameStore.addAnnotation(this.uuid);
        } else if (this.annotation === "" && hadAnnotation) {
            gameStore.removeAnnotation(this.uuid);
        }
    }

    setAnnotationVisible(visible: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetAnnotationVisible({ shape: this.uuid, value: visible });
        if (syncTo === SyncTo.UI) this._("setAnnotationVisible")(visible, syncTo);

        this.annotationVisible = visible;
    }

    addLabel(label: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeAddLabel({ shape: this.uuid, value: label });
        if (syncTo === SyncTo.UI) this._("addLabel")(label, syncTo);

        const l = gameStore.state.labels.get(label)!;
        this.labels.push(l);
    }

    removeLabel(label: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeRemoveLabel({ shape: this.uuid, value: label });
        if (syncTo === SyncTo.UI) this._("removeLabel")(label, syncTo);

        this.labels = this.labels.filter((l) => l.uuid !== label);
    }

    // Extra Utilities

    private checkVisionSources(recalculate = true): boolean {
        let alteredVision = false;
        const visionBlockers = visionState.getBlockers(
            TriangulationTarget.VISION,
            this._floor ?? floorStore.currentFloor.value!.id,
        );
        const obstructionIndex = visionBlockers.indexOf(this.uuid);
        if (this.blocksVision && obstructionIndex === -1) {
            visionState.addBlocker(
                TriangulationTarget.VISION,
                this.uuid,
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

        // Check if the visionsource auras are in the gameManager
        const visionSources: { shape: string; aura: string }[] = [
            ...visionState.getVisionSources(this._floor ?? floorStore.currentFloor.value!.id),
        ];
        for (const au of this.getAuras(true)) {
            const i = visionSources.findIndex((o) => o.aura === au.uuid);
            const isVisionSource = au.visionSource && au.active;
            if (isVisionSource && i === -1) {
                visionSources.push({ shape: this.uuid, aura: au.uuid });
            } else if (!isVisionSource && i >= 0) {
                visionSources.splice(i, 1);
            }
        }
        // Check if anything in the gameManager referencing this shape is in fact still a visionsource
        for (let i = visionSources.length - 1; i >= 0; i--) {
            const ls = visionSources[i];
            if (ls.shape === this.uuid) {
                if (!this.getAuras(true).some((a) => a.uuid === ls.aura && a.visionSource && a.active))
                    visionSources.splice(i, 1);
            }
        }
        visionState.setVisionSources(visionSources, this._floor ?? floorStore.currentFloor.value!.id);
        return alteredVision;
    }
}
