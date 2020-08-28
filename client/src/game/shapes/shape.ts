import { uuidv4 } from "@/core/utils";
import { aurasFromServer, aurasToServer, partialAuraToServer } from "@/game/comm/conversion/aura";
import { InitiativeData } from "@/game/comm/types/general";
import { accessToServer, ownerToClient, ownerToServer, ServerShape } from "@/game/comm/types/shapes";
import { GlobalPoint, LocalPoint, Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
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
import tinycolor from "tinycolor2";
import { PartialBy } from "../../core/types";
import {
    sendShapeAddOwner,
    sendShapeDeleteOwner,
    sendShapeUpdateDefaultOwner,
    sendShapeUpdateOwner,
} from "../api/emits/access";
import {
    sendShapeCreateTracker,
    sendShapeRemoveAura,
    sendShapeRemoveLabel,
    sendShapeRemoveTracker,
    sendShapeSetAnnotation,
    sendShapeSetBlocksMovement,
    sendShapeSetBlocksVision,
    sendShapeSetFillColour,
    sendShapeSetInvisible,
    sendShapeSetIsToken,
    sendShapeSetLocked,
    sendShapeSetName,
    sendShapeSetNameVisible,
    sendShapeSetStrokeColour,
    sendShapeUpdateAura,
    sendShapeUpdateTracker,
    sendShapeCreateAura,
    sendShapeSetShowBadge,
} from "../api/emits/shape/options";
import { Floor } from "../layers/floor";
import { Layer } from "../layers/layer";
import { getFloorId } from "../layers/store";
import { gameSettingsStore } from "../settings";
import { rotateAroundPoint } from "../utils";
import { BoundingRect } from "./boundingrect";
import { PartialShapeOwner, ShapeAccess, ShapeOwner } from "./owners";
import { SHAPE_TYPE } from "./types";

export abstract class Shape {
    // Used to create class instance from server shape data
    abstract readonly type: SHAPE_TYPE;
    // The unique ID of this shape
    readonly uuid: string;
    // The layer the shape is currently on
    private _floor!: number;
    private _layer!: string;

    // Explicitly prevent any sync to the server
    preventSync = false;

    // A reference point regarding that specific shape's structure
    protected _refPoint: GlobalPoint;
    protected _angle = 0;

    // Fill colour of the shape
    fillColour = "#000";
    strokeColour = "rgba(0,0,0,0)";
    strokeWidth = 5;
    // The optional name associated with the shape
    name = "Unknown shape";
    nameVisible = true;

    // Associated trackers/auras/owners
    trackers: Tracker[] = [];
    auras: Aura[] = [];
    labels: Label[] = [];
    protected _owners: ShapeOwner[] = [];

    // Block light sources
    visionObstruction = false;
    // Prevent shapes from overlapping with this shape
    movementObstruction = false;
    // Does this shape represent a playable token
    isToken = false;
    isInvisible = false;
    // Show a highlight box
    showHighlight = false;

    // Mouseover annotation
    annotation = "";

    // Draw modus to use
    globalCompositeOperation = "source-over";

    // Additional options for specialized uses
    options: Map<string, any> = new Map();

    badge = 1;
    showBadge = false;

    isLocked = false;
    defaultAccess: ShapeAccess = { vision: false, movement: false, edit: false };

    constructor(refPoint: GlobalPoint, fillColour?: string, strokeColour?: string, uuid?: string) {
        this._refPoint = refPoint;
        this.uuid = uuid || uuidv4();
        if (fillColour !== undefined) this.fillColour = fillColour;
        if (strokeColour !== undefined) this.strokeColour = strokeColour;
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
        return this.isToken || this.auras.some(a => a.visionSource) || this.movementObstruction;
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
    visibleInCanvas(canvas: HTMLCanvasElement): boolean {
        for (const aura of this.auras) {
            if (aura.value > 0 || aura.dim > 0) {
                const r = getUnitDistance(aura.value + aura.dim);
                const center = this.center();
                const auraArea = new BoundingRect(new GlobalPoint(center.x - r, center.y - r), r * 2, r * 2);
                if (auraArea.visibleInCanvas(canvas)) return true;
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
        const visionBlockers = getBlockers(TriangulationTarget.VISION, this._floor);
        const obstructionIndex = visionBlockers.indexOf(this.uuid);
        if (this.visionObstruction && obstructionIndex === -1) {
            addBlocker(TriangulationTarget.VISION, this.uuid, this._floor);
            if (recalculate) visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: this });
            alteredVision = true;
        } else if (!this.visionObstruction && obstructionIndex >= 0) {
            sliceBlockers(TriangulationTarget.VISION, obstructionIndex, this._floor);
            if (recalculate) visibilityStore.deleteFromTriag({ target: TriangulationTarget.VISION, shape: this });
            alteredVision = true;
        }
        if (alteredVision && recalculate) visibilityStore.recalculateVision(this._floor);

        // Check if the visionsource auras are in the gameManager
        const visionSources: { shape: string; aura: string }[] = [...getVisionSources(this._floor)];
        for (const au of this.auras) {
            const i = visionSources.findIndex(o => o.aura === au.uuid);
            if (au.visionSource && i === -1) {
                visionSources.push({ shape: this.uuid, aura: au.uuid });
            } else if (!au.visionSource && i >= 0) {
                visionSources.splice(i, 1);
            }
        }
        // Check if anything in the gameManager referencing this shape is in fact still a visionsource
        for (let i = visionSources.length - 1; i >= 0; i--) {
            const ls = visionSources[i];
            if (ls.shape === this.uuid) {
                if (!this.auras.some(a => a.uuid === ls.aura && a.visionSource)) visionSources.splice(i, 1);
            }
        }
        setVisionSources(visionSources, this._floor);
        return alteredVision;
    }

    abstract asDict(): ServerShape;
    getBaseDict(): ServerShape {
        /* eslint-disable @typescript-eslint/camelcase */
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
            auras: aurasToServer(this.uuid, this.auras),
            trackers: this.trackers,
            labels: this.labels,
            owners: this._owners.map(owner => ownerToServer(owner)),
            fill_colour: this.fillColour,
            stroke_colour: this.strokeColour,
            stroke_width: this.strokeWidth,
            name: this.name,
            name_visible: this.nameVisible,
            annotation: this.annotation,
            is_token: this.isToken,
            is_invisible: this.isInvisible,
            options: JSON.stringify([...this.options]),
            badge: this.badge,
            show_badge: this.showBadge,
            is_locked: this.isLocked,
            default_edit_access: this.defaultAccess.edit,
            default_movement_access: this.defaultAccess.movement,
            default_vision_access: this.defaultAccess.vision,
        };
    }
    fromDict(data: ServerShape): void {
        this._layer = data.layer;
        this._floor = getFloorId(data.floor);
        this.angle = data.angle;
        this.globalCompositeOperation = data.draw_operator;
        this.movementObstruction = data.movement_obstruction;
        this.visionObstruction = data.vision_obstruction;
        this.auras = aurasFromServer(data.auras);
        this.trackers = data.trackers;
        this.labels = data.labels;
        this._owners = data.owners.map(owner => ownerToClient(owner));
        this.fillColour = data.fill_colour;
        this.strokeColour = data.stroke_colour;
        this.isToken = data.is_token;
        this.isInvisible = data.is_invisible;
        this.nameVisible = data.name_visible;
        this.badge = data.badge;
        this.showBadge = data.show_badge;
        this.isLocked = data.is_locked;
        if (data.annotation) this.annotation = data.annotation;
        if (data.name) this.name = data.name;
        if (data.options) this.options = new Map(JSON.parse(data.options));
        // retain reactivity
        this.updateDefaultOwner(
            {
                edit: data.default_edit_access,
                vision: data.default_vision_access,
                movement: data.default_movement_access,
            },
            false,
        );
    }

    getPositionRepresentation(): { angle: number; points: number[][] } {
        return { angle: this.angle, points: [this.refPoint.asArray()] };
    }

    setPositionRepresentation(position: { angle: number; points: number[][] }): void {
        this.refPoint = GlobalPoint.fromArray(position.points[0]);
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

            ctx.font = `${1.8 * r}px bold Calibri, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${this.badge}`, location.x - r, location.y - r + g2lz(1));
        }
        if (this.showHighlight) {
            if (bbox === undefined) bbox = this.getBoundingBox();
            ctx.strokeStyle = "red";
            ctx.strokeRect(g2lx(bbox.topLeft.x) - 5, g2ly(bbox.topLeft.y) - 5, g2lz(bbox.w) + 10, g2lz(bbox.h) + 10);
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
            // eslint-disable-next-line @typescript-eslint/camelcase
            has_img: false,
            effects: [],
            index: Infinity,
        };
    }

    // This screws up vetur if typed as `readonly string[]`
    // eslint-disable-next-line @typescript-eslint/array-type
    get owners(): ReadonlyArray<ShapeOwner> {
        return Object.freeze(this._owners.slice());
    }

    ownedBy(options: Partial<{ editAccess: boolean; visionAccess: boolean; movementAccess: boolean }>): boolean {
        return (
            gameStore.IS_DM ||
            (gameStore.FAKE_PLAYER && gameStore.activeTokens.includes(this.uuid)) ||
            (options.editAccess && this.defaultAccess.edit) ||
            (options.movementAccess && this.defaultAccess.movement) ||
            (options.visionAccess && this.defaultAccess.vision) ||
            this._owners.some(
                u =>
                    u.user === gameStore.username &&
                    (options.editAccess ? u.access.edit === true : true) &&
                    (options.movementAccess ? u.access.movement === true : true) &&
                    (options.visionAccess ? u.access.vision === true : true),
            )
        );
    }

    hasOwner(username: string): boolean {
        return this._owners.some(u => u.user === username);
    }

    addOwner(owner: PartialBy<PartialShapeOwner, "shape">, sync: boolean): void {
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
            this._owners.push(fullOwner);
            if (owner.access.vision && this.isToken && owner.user === gameStore.username)
                gameStore.ownedtokens.push(this.uuid);
            if (sync) sendShapeAddOwner(ownerToServer(fullOwner));
            if (gameSettingsStore.fowLos) layerManager.invalidateLightAllFloors();
        }
    }

    updateOwner(owner: PartialBy<ShapeOwner, "shape">, sync: boolean): void {
        const fullOwner: ShapeOwner = { shape: this.uuid, ...owner };
        if (fullOwner.shape !== this.uuid) return;
        if (!this.hasOwner(owner.user)) return;
        const targetOwner = this._owners.find(o => o.user === owner.user)!;
        if (!targetOwner.access.edit && fullOwner.access.edit) {
            // Force other permissions to true if edit access is granted
            owner.access.movement = true;
            owner.access.vision = true;
        }
        if (targetOwner.access.edit && Object.values(fullOwner.access).some(a => !a)) {
            // Force remove edit permission if a specific permission is toggled off
            fullOwner.access.edit = false;
        }
        if (targetOwner.access.vision !== fullOwner.access.vision) {
            if (targetOwner.user === gameStore.username) {
                const ownedIndex = gameStore.ownedtokens.indexOf(this.uuid);
                if (fullOwner.access.vision) {
                    if (ownedIndex === -1) gameStore.ownedtokens.push(this.uuid);
                } else {
                    if (ownedIndex >= 0) gameStore.ownedtokens.splice(ownedIndex, 1);
                }
            }
        }
        targetOwner.access = fullOwner.access;
        if (sync) sendShapeUpdateOwner(ownerToServer(fullOwner));
        if (gameSettingsStore.fowLos) layerManager.invalidateLightAllFloors();
    }

    removeOwner(owner: string, sync: boolean): void {
        const ownerIndex = this._owners.findIndex(o => o.user === owner);
        if (ownerIndex < 0) return;
        const removed = this._owners.splice(ownerIndex, 1)[0];
        if (owner === gameStore.username) {
            const ownedIndex = gameStore.ownedtokens.indexOf(this.uuid);
            if (ownedIndex >= 0) gameStore.ownedtokens.splice(ownedIndex, 1);
        }
        if (sync) sendShapeDeleteOwner(ownerToServer(removed));
        if (gameSettingsStore.fowLos) layerManager.invalidateLightAllFloors();
    }

    updateDefaultOwner(access: ShapeAccess, sync: boolean): void {
        if (!this.defaultAccess.edit && access.edit) {
            // Force other permissions to true if edit access is granted
            access.movement = true;
            access.vision = true;
        }
        if (this.defaultAccess.edit && Object.values(access).some(a => !a)) {
            // Force remove edit permission if a specific permission is toggled off
            access.edit = false;
        }
        this.defaultAccess = access;

        const ownedIndex = gameStore.ownedtokens.indexOf(this.uuid);
        if (this.defaultAccess.vision) {
            if (this.ownedBy({ visionAccess: true }) && ownedIndex === -1) gameStore.ownedtokens.push(this.uuid);
        } else {
            if (!this.ownedBy({ visionAccess: true }) && ownedIndex >= 0) gameStore.ownedtokens.splice(ownedIndex, 1);
        }
        if (gameSettingsStore.fowLos) layerManager.invalidateLightAllFloors();
        if (sync) sendShapeUpdateDefaultOwner({ ...accessToServer(this.defaultAccess), shape: this.uuid });
    }

    updatePoints(): void {
        this.layer.updateShapePoints(this);
    }

    getGroupMembers(): Shape[] {
        if (!(this.options.has("groupId") || this.options.has("groupInfo"))) return [this];
        const groupId = this.options.get("groupId") ?? this.uuid;
        const groupLeader = groupId === this.uuid ? this : layerManager.UUIDMap.get(groupId);
        if (groupLeader === undefined || !groupLeader.options.has("groupInfo")) return [this];
        const groupIds = <string[]>groupLeader.options.get("groupInfo");
        return [
            groupLeader,
            ...groupIds.reduce(
                (acc: Shape[], u: string) =>
                    layerManager.UUIDMap.has(u) ? [...acc, layerManager.UUIDMap.get(u)!] : acc,
                [],
            ),
        ];
    }

    updateShapeVision(alteredMovement: boolean, alteredVision: boolean): void {
        if (this.visionObstruction && !alteredVision) {
            visibilityStore.deleteFromTriag({
                target: TriangulationTarget.VISION,
                shape: this,
            });
            visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: this });
            visibilityStore.recalculateVision(this.floor.id);
        }
        this.invalidate(false);
        layerManager.invalidateLightAllFloors();
        if (this.movementObstruction && !alteredMovement) {
            visibilityStore.deleteFromTriag({
                target: TriangulationTarget.MOVEMENT,
                shape: this,
            });
            visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: this });
            visibilityStore.recalculateMovement(this.floor.id);
        }
    }

    // SETTERS

    setVisionBlock(blocksVision: boolean, sync: boolean, recalculate = true): void {
        if (sync) sendShapeSetBlocksVision({ shape: this.uuid, value: blocksVision });
        this.visionObstruction = blocksVision;
        const alteredVision = this.checkVisionSources(recalculate);
        if (alteredVision && recalculate) this.invalidate(false);
    }

    setMovementBlock(blocksMovement: boolean, sync: boolean, recalculate = true): boolean {
        if (sync) sendShapeSetBlocksMovement({ shape: this.uuid, value: blocksMovement });
        let alteredMovement = false;
        this.movementObstruction = blocksMovement;
        const movementBlockers = getBlockers(TriangulationTarget.MOVEMENT, this._floor);
        const obstructionIndex = movementBlockers.indexOf(this.uuid);
        if (this.movementObstruction && obstructionIndex === -1) {
            addBlocker(TriangulationTarget.MOVEMENT, this.uuid, this._floor);
            if (recalculate) visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: this });
            alteredMovement = true;
        } else if (!this.movementObstruction && obstructionIndex >= 0) {
            sliceBlockers(TriangulationTarget.MOVEMENT, obstructionIndex, this._floor);
            if (recalculate) visibilityStore.deleteFromTriag({ target: TriangulationTarget.MOVEMENT, shape: this });
            alteredMovement = true;
        }
        if (alteredMovement && recalculate) visibilityStore.recalculateMovement(this._floor);
        return alteredMovement;
    }

    setIsToken(isToken: boolean, sync: boolean): void {
        if (sync) sendShapeSetIsToken({ shape: this.uuid, value: isToken });
        this.isToken = isToken;
        if (this.ownedBy({ visionAccess: true })) {
            const i = gameStore.ownedtokens.indexOf(this.uuid);
            if (this.isToken && i === -1) gameStore.ownedtokens.push(this.uuid);
            else if (!this.isToken && i >= 0) gameStore.ownedtokens.splice(i, 1);
        }
        this.invalidate(false);
    }

    setInvisible(isInvisible: boolean, sync: boolean): void {
        this.isInvisible = isInvisible;
        if (sync) sendShapeSetInvisible({ shape: this.uuid, value: isInvisible });
        this.invalidate(!this.triggersVisionRecalc);
    }

    setLocked(isLocked: boolean, sync: boolean): void {
        this.isLocked = isLocked;
        if (sync) sendShapeSetLocked({ shape: this.uuid, value: isLocked });
    }

    setShowBadge(showBadge: boolean, sync: boolean): void {
        this.showBadge = showBadge;
        if (sync) sendShapeSetShowBadge({ shape: this.uuid, value: this.showBadge });
        this.invalidate(!this.triggersVisionRecalc);
    }

    setAnnotation(text: string, sync: boolean): void {
        if (sync) sendShapeSetAnnotation({ shape: this.uuid, value: text });
        const hadAnnotation = this.annotation !== "";
        this.annotation = text;
        if (this.annotation !== "" && !hadAnnotation) {
            gameStore.annotations.push(this.uuid);
        } else if (this.annotation === "" && hadAnnotation) {
            gameStore.annotations.splice(gameStore.annotations.findIndex(an => an === this.uuid));
        }
    }

    removeTracker(tracker: string, sync: boolean): void {
        if (sync) sendShapeRemoveTracker({ shape: this.uuid, value: tracker });
        this.trackers = this.trackers.filter(tr => tr.uuid !== tracker);
    }

    removeAura(aura: string, sync: boolean): void {
        if (sync) sendShapeRemoveAura({ shape: this.uuid, value: aura });
        this.auras = this.auras.filter(au => au.uuid !== aura);
        this.checkVisionSources();
        this.invalidate(false);
    }

    removeLabel(label: string, sync: boolean): void {
        if (sync) sendShapeRemoveLabel({ shape: this.uuid, value: label });
        this.labels = this.labels.filter(l => l.uuid !== label);
    }

    setName(name: string, sync: boolean): void {
        if (sync) sendShapeSetName({ shape: this.uuid, value: name });
        this.name = name;
    }

    setNameVisible(visible: boolean, sync: boolean): void {
        if (sync) sendShapeSetNameVisible({ shape: this.uuid, value: visible });
        this.nameVisible = visible;
    }

    setStrokeColour(colour: string, sync: boolean): void {
        if (sync) sendShapeSetStrokeColour({ shape: this.uuid, value: colour });
        this.strokeColour = colour;
        this.invalidate(true);
    }

    setFillColour(colour: string, sync: boolean): void {
        if (sync) sendShapeSetFillColour({ shape: this.uuid, value: colour });
        this.fillColour = colour;
        this.invalidate(true);
    }

    pushTracker(tracker: Tracker): void {
        this.trackers.push(tracker);
    }

    syncTracker(tracker: Tracker): void {
        if (tracker.temporary === false) {
            console.log("Illegal use of syncTracker");
            return;
        }
        sendShapeCreateTracker({ shape: this.uuid, ...tracker });
        tracker.temporary = false;
    }

    updateTracker(trackerId: string, delta: Partial<Tracker>, sync: boolean): void {
        const tracker = this.trackers.find(t => t.uuid === trackerId);
        if (tracker === undefined) return;
        Object.assign(tracker, delta);
        if (sync) sendShapeUpdateTracker({ shape: this.uuid, uuid: trackerId, ...delta });
    }

    pushAura(aura: Aura): void {
        this.auras.push(aura);
        this.invalidate(false);
    }

    syncAura(aura: Aura): void {
        if (aura.temporary === false) {
            console.log("Illegal use of syncAura");
            return;
        }
        sendShapeCreateAura(aurasToServer(this.uuid, [aura])[0]);
        aura.temporary = false;
    }

    updateAura(auraId: string, delta: Partial<Aura>, sync: boolean): void {
        const aura = this.auras.find(t => t.uuid === auraId);
        if (aura === undefined) return;

        const visionSources = getVisionSources(this.floor.id);
        const i = visionSources.findIndex(ls => ls.aura === aura.uuid);

        Object.assign(aura, delta);

        if (aura.visionSource && i === -1) addVisionSource({ shape: this.uuid, aura: aura.uuid }, this.floor.id);
        else if (!aura.visionSource && i >= 0) sliceVisionSources(i, this.floor.id);

        if (sync)
            sendShapeUpdateAura({
                ...partialAuraToServer({
                    ...delta,
                }),
                shape: this.uuid,
                uuid: auraId,
            });

        this.invalidate(false);
    }
}
