import tinycolor from "tinycolor2";

import { uuidv4 } from "@/core/utils";
import { GlobalPoint, LocalPoint, Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { aurasFromServer, aurasToServer, partialAuraToServer } from "@/game/models/conversion/aura";
import { InitiativeData } from "@/game/models/general";
import { accessToServer, ownerToClient, ownerToServer, ServerShape } from "@/game/models/shapes";
import { gameStore } from "@/game/store";
import { g2l, g2lx, g2ly, g2lz, getUnitDistance } from "@/game/units";
import { visibilityStore } from "@/game/visibility/store";
import { TriangulationTarget } from "@/game/visibility/te/pa";
import {
    addBlocker,
    addVisionSource,
    getBlockers,
    getVisionSources,
    setVisionSources,
    sliceBlockers,
    sliceVisionSources,
} from "@/game/visibility/utils";

import { SyncTo } from "../../core/models/types";
import { PartialBy } from "../../core/types";
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
    sendShapeSetFillColour,
    sendShapeSetInvisible,
    sendShapeSetDefeated,
    sendShapeSetIsToken,
    sendShapeSetLocked,
    sendShapeSetName,
    sendShapeSetNameVisible,
    sendShapeSetShowBadge,
    sendShapeSetStrokeColour,
    sendShapeUpdateAura,
    sendShapeUpdateTracker,
} from "../api/emits/shape/options";
import { EventBus } from "../event-bus";
import { getBadgeCharacters } from "../groups";
import { Floor } from "../layers/floor";
import { Layer } from "../layers/layer";
import { floorStore, getFloorId } from "../layers/store";
import { gameSettingsStore } from "../settings";
import { activeShapeStore } from "../ui/ActiveShapeStore";
import { rotateAroundPoint } from "../utils";

import { Aura, Label, Tracker } from "./interfaces";
import { PartialShapeOwner, ShapeAccess, ShapeOwner } from "./owners";
import { SHAPE_TYPE } from "./types";
import { BoundingRect } from "./variants/boundingrect";

export abstract class Shape {
    // Used to create class instance from server shape data
    abstract readonly type: SHAPE_TYPE;
    // The unique ID of this shape
    readonly uuid: string;
    // The layer the shape is currently on
    private _floor!: number | undefined;
    private _layer!: string;

    // Explicitly prevent any sync to the server
    preventSync = false;

    // A reference point regarding that specific shape's structure
    protected _refPoint: GlobalPoint;
    protected _angle = 0;

    // Fill colour of the shape
    fillColour: string;
    strokeColour: string;
    strokeWidth = 5;
    // When set to true this shape should not use g2lz converting logic for its sizing
    // This is used for things like the ruler, which should always have the same size irregardles of zoom state
    ignoreZoomSize = false;
    // The optional name associated with the shape
    name = "Unknown shape";
    nameVisible = true;

    assetId?: number;
    groupId?: string;

    // Associated trackers/auras
    private _trackers: Tracker[] = [];
    private _auras: Aura[] = [];
    labels: Label[] = [];

    // Block light sources
    visionObstruction = false;
    // Prevent shapes from overlapping with this shape
    movementObstruction = false;
    // Does this shape represent a playable token
    isToken = false;
    isInvisible = false;
    isDefeated = false;
    // Show a highlight box
    showHighlight = false;

    // Mouseover annotation
    annotation = "";
    annotationVisible = false;

    // Draw modus to use
    globalCompositeOperation = "source-over";

    // Additional options for specialized uses
    options: Map<string, any> = new Map();

    badge = 0;
    showBadge = false;

    isLocked = false;

    // Access
    defaultAccess: ShapeAccess = { vision: false, movement: false, edit: false };
    protected _owners: ShapeOwner[] = [];

    constructor(
        refPoint: GlobalPoint,
        options?: { fillColour?: string; strokeColour?: string; uuid?: string; assetId?: number },
    ) {
        this._refPoint = refPoint;
        this.uuid = options?.uuid ?? uuidv4();
        this.fillColour = options?.fillColour ?? "#000";
        this.strokeColour = options?.strokeColour ?? "rgba(0,0,0,0)";
        this.assetId = options?.assetId;
    }

    // Are the last and first point connected
    get isClosed(): boolean {
        return true;
    }

    get refPoint(): GlobalPoint {
        return this._refPoint;
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

    get floor(): Floor {
        return layerManager.getFloor(this._floor)!;
    }

    get layer(): Layer {
        return layerManager.getLayer(this.floor, this._layer)!;
    }

    /**
     * Returns true if this shape should trigger a vision recalculation when it moves or otherwise mutates.
     * This is the case when it is a token, has an aura that is a vision source or if it blocks vision.
     */
    get triggersVisionRecalc(): boolean {
        return this.isToken || this.getAuras(true).some((a) => a.visionSource) || this.movementObstruction;
    }

    setLayer(floor: number, layer: string): void {
        this._floor = floor;
        this._layer = layer;
    }

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
        return new BoundingRect(
            new GlobalPoint(minx - delta, miny - delta),
            maxx - minx + 2 * delta,
            maxy - miny + 2 * delta,
        );
    }

    getBoundingBox(delta = 0): BoundingRect {
        return this.getAABB(delta);
    }

    abstract contains(point: GlobalPoint, nearbyThreshold?: number): boolean;

    abstract center(): GlobalPoint;
    abstract center(centerPoint: GlobalPoint): void;
    visibleInCanvas(canvas: HTMLCanvasElement, options: { includeAuras: boolean }): boolean {
        if (options.includeAuras) {
            for (const aura of this.getAuras(true)) {
                if (aura.value > 0 || aura.dim > 0) {
                    const r = getUnitDistance(aura.value + aura.dim);
                    const center = this.center();
                    const auraArea = new BoundingRect(new GlobalPoint(center.x - r, center.y - r), r * 2, r * 2);
                    if (auraArea.visibleInCanvas(canvas)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Code to snap a shape to the grid
    // This is shape dependent as the shape refPoints are shape specific in
    abstract snapToGrid(): void;
    abstract resizeToGrid(resizePoint: number, retainAspectRatio: boolean): void;
    abstract resize(resizePoint: number, point: GlobalPoint, retainAspectRatio: boolean): number;

    // abstract rotateAround(point: GlobalPoint, angle: number): void;
    rotateAround(point: GlobalPoint, angle: number): void {
        const center = this.center();
        if (!point.equals(center)) this.center(rotateAroundPoint(center, point, angle));
        this.angle += angle;
        this.updatePoints();
    }
    rotateAroundAbsolute(point: GlobalPoint, angle: number): void {
        this.rotateAround(point, angle - this.angle);
    }

    abstract get points(): number[][];

    getPointIndex(p: GlobalPoint, delta = 0): number {
        for (const [idx, point] of this.points.entries()) {
            if (Math.abs(p.x - point[0]) <= delta && Math.abs(p.y - point[1]) <= delta) return idx;
        }
        return -1;
    }

    getPointOrientation(i: number): Vector {
        const prev = GlobalPoint.fromArray(this.points[(this.points.length + i - 1) % this.points.length]);
        const point = GlobalPoint.fromArray(this.points[i]);
        const next = GlobalPoint.fromArray(this.points[(i + 1) % this.points.length]);
        const vec = next.subtract(prev);
        const mid = prev.add(vec.multiply(0.5));
        return point.subtract(mid).normalize();
    }

    invalidate(skipLightUpdate: boolean): void {
        this.layer.invalidate(skipLightUpdate);
    }

    private checkVisionSources(recalculate = true): boolean {
        let alteredVision = false;
        const visionBlockers = getBlockers(TriangulationTarget.VISION, this._floor ?? floorStore.currentFloor.id);
        const obstructionIndex = visionBlockers.indexOf(this.uuid);
        if (this.visionObstruction && obstructionIndex === -1) {
            addBlocker(TriangulationTarget.VISION, this.uuid, this._floor ?? floorStore.currentFloor.id, recalculate);
            alteredVision = true;
        } else if (!this.visionObstruction && obstructionIndex >= 0) {
            sliceBlockers(
                TriangulationTarget.VISION,
                obstructionIndex,
                this._floor ?? floorStore.currentFloor.id,
                recalculate,
            );
            alteredVision = true;
        }

        // Check if the visionsource auras are in the gameManager
        const visionSources: { shape: string; aura: string }[] = [
            ...getVisionSources(this._floor ?? floorStore.currentFloor.id),
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
        setVisionSources(visionSources, this._floor ?? floorStore.currentFloor.id);
        return alteredVision;
    }

    abstract asDict(): ServerShape;
    getBaseDict(): ServerShape {
        return {
            type_: this.type,
            uuid: this.uuid,
            x: this.refPoint.x,
            y: this.refPoint.y,
            angle: this.angle,
            floor: layerManager.getFloor(this._floor)!.name,
            layer: this._layer,
            draw_operator: this.globalCompositeOperation,
            movement_obstruction: this.movementObstruction,
            vision_obstruction: this.visionObstruction,
            auras: aurasToServer(this.uuid, this._auras),
            trackers: this._trackers,
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
            options: JSON.stringify([...this.options]),
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
        this._floor = getFloorId(data.floor);
        this.angle = data.angle;
        this.globalCompositeOperation = data.draw_operator;
        this.movementObstruction = data.movement_obstruction;
        this.visionObstruction = data.vision_obstruction;
        this._auras = aurasFromServer(...data.auras);
        this._trackers = data.trackers;
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
        if (data.name) this.name = data.name;
        if (data.options) this.options = new Map(JSON.parse(data.options));
        if (data.asset) this.assetId = data.asset;
        if (data.group) this.groupId = data.group;
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

    getPositionRepresentation(): { angle: number; points: number[][] } {
        return { angle: this.angle, points: [this.refPoint.asArray()] };
    }

    setPositionRepresentation(position: { angle: number; points: number[][] }): void {
        this._refPoint = GlobalPoint.fromArray(position.points[0]);
        this.angle = position.angle;
        this.updateShapeVision(false, false);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.globalCompositeOperation !== undefined) ctx.globalCompositeOperation = this.globalCompositeOperation;
        else ctx.globalCompositeOperation = "source-over";

        const center = g2l(this.center());

        ctx.setTransform(1, 0, 0, 1, center.x, center.y);
        ctx.rotate(this.angle);
    }

    drawPost(ctx: CanvasRenderingContext2D): void {
        ctx.setTransform(1, 0, 0, 1, 0, 0);

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
            ctx.fillStyle = tinycolor.mostReadable(this.strokeColour, ["#000", "#fff"]).toHexString();

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
            bbox = this.getBoundingBox();
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

    getAnchorLocation(): LocalPoint {
        const center = g2l(this.center());
        const bb = this.getBoundingBox();
        const z = gameStore.zoomFactor;
        return new LocalPoint(center.x, center.y - 100 * z - (bb.h * z) / 2);
    }

    getInitiativeRepr(): InitiativeData {
        return {
            uuid: this.uuid,
            visible: !gameStore.IS_DM,
            group: false,
            source: this.name,
            has_img: false,
            effects: [],
            index: Infinity,
        };
    }

    updatePoints(): void {
        this.layer.updateShapePoints(this);
    }

    updateShapeVision(alteredMovement: boolean, alteredVision: boolean): void {
        if (this.visionObstruction && !alteredVision) {
            visibilityStore.deleteFromTriag({
                target: TriangulationTarget.VISION,
                shape: this.uuid,
            });
            visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: this.uuid });
            visibilityStore.recalculateVision(this.floor.id);
        }
        this.invalidate(false);
        layerManager.invalidateLightAllFloors();
        if (this.movementObstruction && !alteredMovement) {
            visibilityStore.deleteFromTriag({
                target: TriangulationTarget.MOVEMENT,
                shape: this.uuid,
            });
            visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: this.uuid });
            visibilityStore.recalculateMovement(this.floor.id);
        }
    }

    // UTILITY

    /**
     * This utility function is used to avoid repetitive if checks.
     * It calls the given function, if the current active shape is this shape.
     *
     * Its primary intended use is to update the UI if the current shape is being displayed.
     *
     * @param f A function that should be called if the current shape is the active shape
     * @param args the args of the above function
     */
    protected _<T extends unknown[], R = unknown>(f: (...args: T) => R, ...args: T): void {
        if (this.uuid === activeShapeStore.uuid) f(...args);
    }

    // PROPERTIES

    setName(name: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetName({ shape: this.uuid, value: name });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setName, { name, syncTo });

        this.name = name;
        // Initiative names are not always updated when renaming shapes
        // This is due to these shapes not yet being reactive
        EventBus.$emit("Initiative.ForceUpdate");
    }

    setNameVisible(visible: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetNameVisible({ shape: this.uuid, value: visible });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setNameVisible, { visible, syncTo });

        this.nameVisible = visible;
    }

    setIsToken(isToken: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetIsToken({ shape: this.uuid, value: isToken });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setIsToken, { isToken, syncTo });

        this.isToken = isToken;
        if (this.ownedBy(false, { visionAccess: true })) {
            if (this.isToken) gameStore.addOwnedToken(this.uuid);
            else gameStore.removeOwnedToken(this.uuid);
        }
        this.invalidate(false);
    }

    setInvisible(isInvisible: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetInvisible({ shape: this.uuid, value: isInvisible });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setIsInvisible, { isInvisible, syncTo });

        this.isInvisible = isInvisible;
        this.invalidate(!this.triggersVisionRecalc);
    }

    setDefeated(isDefeated: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetDefeated({ shape: this.uuid, value: isDefeated });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setIsDefeated, { isDefeated, syncTo });

        this.isDefeated = isDefeated;
        this.invalidate(!this.triggersVisionRecalc);
    }

    setStrokeColour(colour: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetStrokeColour({ shape: this.uuid, value: colour });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setStrokeColour, { colour, syncTo });

        this.strokeColour = colour;
        this.invalidate(true);
    }

    setFillColour(colour: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetFillColour({ shape: this.uuid, value: colour });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setFillColour, { colour, syncTo });

        this.fillColour = colour;
        this.invalidate(true);
    }

    setVisionBlock(blocksVision: boolean, syncTo: SyncTo, recalculate = true): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetBlocksVision({ shape: this.uuid, value: blocksVision });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setVisionObstruction, { blocksVision, syncTo });

        this.visionObstruction = blocksVision;
        const alteredVision = this.checkVisionSources(recalculate);
        if (alteredVision && recalculate) this.invalidate(false);
    }

    setMovementBlock(blocksMovement: boolean, syncTo: SyncTo, recalculate = true): boolean {
        if (syncTo === SyncTo.SERVER) sendShapeSetBlocksMovement({ shape: this.uuid, value: blocksMovement });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setMovementObstruction, { blocksMovement, syncTo });

        let alteredMovement = false;
        this.movementObstruction = blocksMovement;
        const movementBlockers = getBlockers(TriangulationTarget.MOVEMENT, this._floor ?? floorStore.currentFloor.id);
        const obstructionIndex = movementBlockers.indexOf(this.uuid);
        if (this.movementObstruction && obstructionIndex === -1) {
            addBlocker(TriangulationTarget.MOVEMENT, this.uuid, this._floor ?? floorStore.currentFloor.id, recalculate);
            alteredMovement = true;
        } else if (!this.movementObstruction && obstructionIndex >= 0) {
            sliceBlockers(
                TriangulationTarget.MOVEMENT,
                obstructionIndex,
                this._floor ?? floorStore.currentFloor.id,
                recalculate,
            );
            alteredMovement = true;
        }

        return alteredMovement;
    }

    setLocked(isLocked: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetLocked({ shape: this.uuid, value: isLocked });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setLocked, { isLocked, syncTo });

        this.isLocked = isLocked;
    }

    setShowBadge(showBadge: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetShowBadge({ shape: this.uuid, value: showBadge });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setShowBadge, { showBadge, syncTo });

        this.showBadge = showBadge;
        this.invalidate(!this.triggersVisionRecalc);
        EventBus.$emit("EditDialog.Group.Update");
    }

    // OPTIONS

    setOptions(options: Map<string, any>, syncTo: SyncTo): void {
        this.options = options;

        if (syncTo === SyncTo.SERVER) sendShapeOptionsUpdate([this], false);
        if (syncTo === SyncTo.UI)
            this._(activeShapeStore.setOptions, { options: Object.fromEntries(this.options), syncTo });
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
        if (gameStore.IS_DM) return true;

        const isActiveToken = gameStore.activeTokens.includes(this.uuid);

        if (this.isToken && limitToActiveTokens && !isActiveToken) return false;

        return (
            gameStore.FAKE_PLAYER ||
            (options.editAccess && this.defaultAccess.edit) ||
            (options.movementAccess && this.defaultAccess.movement) ||
            (options.visionAccess && this.defaultAccess.vision) ||
            this._owners.some(
                (u) =>
                    u.user === gameStore.username &&
                    (options.editAccess ? u.access.edit === true : true) &&
                    (options.movementAccess ? u.access.movement === true : true) &&
                    (options.visionAccess ? u.access.vision === true : true),
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
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setDefaultAccess, { access: this.defaultAccess, syncTo });

        if (this.defaultAccess.vision) {
            if (this.ownedBy(false, { visionAccess: true })) gameStore.addOwnedToken(this.uuid);
        } else {
            if (!this.ownedBy(false, { visionAccess: true })) gameStore.removeOwnedToken(this.uuid);
        }
        if (gameSettingsStore.fowLos) layerManager.invalidateLightAllFloors();
    }

    hasOwner(username: string): boolean {
        return this._owners.some((u) => u.user === username);
    }

    addOwner(owner: PartialBy<PartialShapeOwner, "shape">, syncTo: SyncTo): void {
        // Force other permissions to true if edit access is granted
        if (owner.access.edit) {
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
            if (syncTo === SyncTo.UI) this._(activeShapeStore.addOwner, { owner: fullOwner, syncTo });

            this._owners.push(fullOwner);
            if (owner.access.vision && this.isToken && owner.user === gameStore.username)
                gameStore.addOwnedToken(this.uuid);
            if (gameSettingsStore.fowLos) layerManager.invalidateLightAllFloors();
        }
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
        if (targetOwner.access.edit && Object.values(fullOwner.access).some((a) => !a)) {
            // Force remove edit permission if a specific permission is toggled off
            fullOwner.access.edit = false;
        }

        if (syncTo === SyncTo.SERVER) sendShapeUpdateOwner(ownerToServer(fullOwner));
        if (syncTo === SyncTo.UI) this._(activeShapeStore.updateOwner, { owner: fullOwner, syncTo });

        if (targetOwner.access.vision !== fullOwner.access.vision) {
            if (targetOwner.user === gameStore.username) {
                if (fullOwner.access.vision) {
                    gameStore.addOwnedToken(this.uuid);
                } else {
                    gameStore.removeOwnedToken(this.uuid);
                }
            }
        }
        targetOwner.access = fullOwner.access;
        if (gameSettingsStore.fowLos) layerManager.invalidateLightAllFloors();
    }

    removeOwner(owner: string, syncTo: SyncTo): void {
        const ownerIndex = this._owners.findIndex((o) => o.user === owner);
        if (ownerIndex < 0) return;
        const removed = this._owners.splice(ownerIndex, 1)[0];

        if (syncTo === SyncTo.SERVER) sendShapeDeleteOwner(ownerToServer(removed));
        if (syncTo === SyncTo.UI) this._(activeShapeStore.removeOwner, { owner, syncTo });

        if (owner === gameStore.username) {
            gameStore.removeOwnedToken(owner);
        }
        if (gameSettingsStore.fowLos) layerManager.invalidateLightAllFloors();
    }

    // TRACKERS

    getTrackers(includeParent: boolean): readonly Tracker[] {
        const tr: Tracker[] = [];
        if (includeParent) {
            const parent = layerManager.getCompositeParent(this.uuid);
            if (parent !== undefined) {
                tr.push(...parent.getTrackers(false));
            }
        }
        tr.push(...this._trackers);
        return tr;
    }

    pushTracker(tracker: Tracker, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeCreateTracker({ shape: this.uuid, ...tracker });
        else if (syncTo === SyncTo.UI) this._(activeShapeStore.pushTracker, { tracker, shape: this.uuid, syncTo });

        this._trackers.push(tracker);
    }

    updateTracker(trackerId: string, delta: Partial<Tracker>, syncTo: SyncTo): void {
        const tracker = this._trackers.find((t) => t.uuid === trackerId);
        if (tracker === undefined) return;

        if (syncTo === SyncTo.SERVER) sendShapeUpdateTracker({ shape: this.uuid, uuid: trackerId, ...delta });
        else if (syncTo === SyncTo.UI) this._(activeShapeStore.updateTracker, { tracker: trackerId, delta, syncTo });

        Object.assign(tracker, delta);
    }

    removeTracker(tracker: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeRemoveTracker({ shape: this.uuid, value: tracker });
        else if (syncTo === SyncTo.UI) this._(activeShapeStore.removeTracker, { tracker, syncTo });

        this._trackers = this._trackers.filter((tr) => tr.uuid !== tracker);
    }

    // AURAS

    getAuras(includeParent: boolean): readonly Aura[] {
        const au: Aura[] = [];
        if (includeParent) {
            const parent = layerManager.getCompositeParent(this.uuid);
            if (parent !== undefined) {
                au.push(...parent.getAuras(false));
            }
        }
        au.push(...this._auras);
        return au;
    }

    pushAura(aura: Aura, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeCreateAura(aurasToServer(this.uuid, [aura])[0]);
        else if (syncTo === SyncTo.UI) this._(activeShapeStore.pushAura, { aura, shape: this.uuid, syncTo });

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
            this._(activeShapeStore.updateAura, { aura: auraId, delta, syncTo });
        }

        const visionSources = getVisionSources(this.floor.id);
        const i = visionSources.findIndex((ls) => ls.aura === aura.uuid);

        Object.assign(aura, delta);

        const showsVision = aura.active && aura.visionSource;

        if (showsVision && i === -1) addVisionSource({ shape: this.uuid, aura: aura.uuid }, this.floor.id);
        else if (!showsVision && i >= 0) sliceVisionSources(i, this.floor.id);

        this.invalidate(false);
    }

    removeAura(aura: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeRemoveAura({ shape: this.uuid, value: aura });
        else if (syncTo === SyncTo.UI) this._(activeShapeStore.removeAura, { aura, syncTo });

        this._auras = this._auras.filter((au) => au.uuid !== aura);
        this.checkVisionSources();
        this.invalidate(false);
    }

    // EXTRA

    setAnnotation(text: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetAnnotation({ shape: this.uuid, value: text });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setAnnotation, { annotation: text, syncTo });

        const hadAnnotation = this.annotation !== "";
        this.annotation = text;
        if (this.annotation !== "" && !hadAnnotation) {
            gameStore.annotations.push(this.uuid);
        } else if (this.annotation === "" && hadAnnotation) {
            gameStore.annotations.splice(gameStore.annotations.findIndex((an) => an === this.uuid));
        }
    }

    setAnnotationVisible(visible: boolean, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeSetAnnotationVisible({ shape: this.uuid, value: visible });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.setAnnotationVisible, { visible, syncTo });

        this.annotationVisible = visible;
    }

    addLabel(label: string, syncTo: SyncTo): void {
        const l = gameStore.labels[label];
        if (syncTo === SyncTo.SERVER) sendShapeAddLabel({ shape: this.uuid, value: label });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.addLabel, { label, syncTo });

        this.labels.push(l);
    }

    removeLabel(label: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendShapeRemoveLabel({ shape: this.uuid, value: label });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.removeLabel, { label, syncTo });

        this.labels = this.labels.filter((l) => l.uuid !== label);
    }
}
