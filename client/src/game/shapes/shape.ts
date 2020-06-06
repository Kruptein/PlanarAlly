import { uuidv4 } from "@/core/utils";
import { socket } from "@/game/api/socket";
import { aurasFromServer, aurasToServer } from "@/game/comm/conversion/aura";
import { InitiativeData } from "@/game/comm/types/general";
import { accessToServer, ownerToClient, ownerToServer, ServerShape } from "@/game/comm/types/shapes";
import { GlobalPoint, Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { g2l, g2lx, g2ly, g2lz } from "@/game/units";
import { visibilityStore } from "@/game/visibility/store";
import { TriangulationTarget } from "@/game/visibility/te/pa";
import { addBlocker, getBlockers, getVisionSources, setVisionSources, sliceBlockers } from "@/game/visibility/utils";
import tinycolor from "tinycolor2";
import { PartialBy } from "../../core/types";
import { gameSettingsStore } from "../settings";
import { BoundingRect } from "./boundingrect";
import { PartialShapeOwner, ShapeAccess, ShapeOwner } from "./owners";

export abstract class Shape {
    // Used to create class instance from server shape data
    abstract readonly type: string;
    // The unique ID of this shape
    readonly uuid: string;
    // The layer the shape is currently on
    floor!: string;
    layer!: string;

    // Explicitly prevent any sync to the server
    preventSync = false;

    // A reference point regarding that specific shape's structure
    protected _refPoint: GlobalPoint;

    // Fill colour of the shape
    fillColour = "#000";
    strokeColour = "rgba(0,0,0,0)";
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

    abstract getBoundingBox(): BoundingRect;

    abstract contains(point: GlobalPoint, nearbyThreshold?: number): boolean;

    abstract center(): GlobalPoint;
    abstract center(centerPoint: GlobalPoint): void;
    visibleInCanvas(_canvas: HTMLCanvasElement): boolean {
        // for (const aura of this.auras) {
        //     if (aura.value > 0) {
        //         const auraCircle = new Circle(this.center(), aura.value);
        //         if (auraCircle.visibleInCanvas(canvas)) return true;
        //     }
        // }
        return false;
    }

    // Code to snap a shape to the grid
    // This is shape dependent as the shape refPoints are shape specific in
    abstract snapToGrid(): void;
    abstract resizeToGrid(resizePoint: number, retainAspectRatio: boolean): void;
    abstract resize(resizePoint: number, point: GlobalPoint, retainAspectRatio: boolean): number;

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
        const l = layerManager.getLayer(this.floor, this.layer);
        if (l) l.invalidate(skipLightUpdate);
    }

    checkVisionSources(recalculate = true): boolean {
        let alteredVision = false;
        const visionBlockers = getBlockers(TriangulationTarget.VISION, this.floor);
        const obstructionIndex = visionBlockers.indexOf(this.uuid);
        if (this.visionObstruction && obstructionIndex === -1) {
            addBlocker(TriangulationTarget.VISION, this.uuid, this.floor);
            if (recalculate) visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: this });
            alteredVision = true;
        } else if (!this.visionObstruction && obstructionIndex >= 0) {
            sliceBlockers(TriangulationTarget.VISION, obstructionIndex, this.floor);
            if (recalculate) visibilityStore.deleteFromTriag({ target: TriangulationTarget.VISION, shape: this });
            alteredVision = true;
        }
        if (alteredVision && recalculate) visibilityStore.recalculateVision(this.floor);

        // Check if the visionsource auras are in the gameManager
        const visionSources: { shape: string; aura: string }[] = [...getVisionSources(this.floor)];
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
        setVisionSources(visionSources, this.floor);
        return alteredVision;
    }

    setMovementBlock(blocksMovement: boolean, recalculate = true): boolean {
        let alteredMovement = false;
        this.movementObstruction = blocksMovement || false;
        const movementBlockers = getBlockers(TriangulationTarget.MOVEMENT, this.floor);
        const obstructionIndex = movementBlockers.indexOf(this.uuid);
        if (this.movementObstruction && obstructionIndex === -1) {
            addBlocker(TriangulationTarget.MOVEMENT, this.uuid, this.floor);
            if (recalculate) visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: this });
            alteredMovement = true;
        } else if (!this.movementObstruction && obstructionIndex >= 0) {
            sliceBlockers(TriangulationTarget.MOVEMENT, obstructionIndex, this.floor);
            if (recalculate) visibilityStore.deleteFromTriag({ target: TriangulationTarget.MOVEMENT, shape: this });
            alteredMovement = true;
        }
        if (alteredMovement && recalculate) visibilityStore.recalculateMovement(this.floor);
        return alteredMovement;
    }

    setIsToken(isToken: boolean): void {
        this.isToken = isToken;
        if (this.ownedBy({ visionAccess: true })) {
            const i = gameStore.ownedtokens.indexOf(this.uuid);
            if (this.isToken && i === -1) gameStore.ownedtokens.push(this.uuid);
            else if (!this.isToken && i >= 0) gameStore.ownedtokens.splice(i, 1);
        }
    }

    setInvisible(isInvisible: boolean, sync: boolean): void {
        this.isInvisible = isInvisible;
        // eslint-disable-next-line @typescript-eslint/camelcase
        if (sync) socket.emit("Shape.Options.Invisible.Set", { shape: this.uuid, is_invisible: isInvisible });
        this.invalidate(true);
    }

    setLocked(isLocked: boolean, sync: boolean): void {
        this.isLocked = isLocked;
        // eslint-disable-next-line @typescript-eslint/camelcase
        if (sync) socket.emit("Shape.Options.Locked.Set", { shape: this.uuid, is_locked: isLocked });
        this.invalidate(true);
    }

    abstract asDict(): ServerShape;
    getBaseDict(): ServerShape {
        /* eslint-disable @typescript-eslint/camelcase */
        return {
            type_: this.type,
            uuid: this.uuid,
            x: this.refPoint.x,
            y: this.refPoint.y,
            floor: this.floor,
            layer: this.layer,
            draw_operator: this.globalCompositeOperation,
            movement_obstruction: this.movementObstruction,
            vision_obstruction: this.visionObstruction,
            auras: aurasToServer(this.auras),
            trackers: this.trackers,
            labels: this.labels,
            owners: this._owners.map(owner => ownerToServer(owner)),
            fill_colour: this.fillColour,
            stroke_colour: this.strokeColour,
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
        this.layer = data.layer;
        this.floor = data.floor;
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

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.globalCompositeOperation !== undefined) ctx.globalCompositeOperation = this.globalCompositeOperation;
        else ctx.globalCompositeOperation = "source-over";
    }

    drawPost(ctx: CanvasRenderingContext2D): void {
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
        ctx.globalCompositeOperation = this.globalCompositeOperation;
        const z = gameStore.zoomFactor;
        const bb = this.getBoundingBox();
        ctx.strokeRect(g2lx(bb.topLeft.x), g2ly(bb.topLeft.y), bb.w * z, bb.h * z);

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

    moveFloor(floor: string, sync: boolean): void {
        const oldLayer = layerManager.getLayer(this.floor, this.layer);
        const newLayer = layerManager.getLayer(floor, this.layer);
        if (oldLayer === undefined || newLayer === undefined) return;
        visibilityStore.moveShape({ shape: this, oldFloor: this.floor, newFloor: floor });
        this.floor = floor;
        oldLayer.shapes.splice(oldLayer.shapes.indexOf(this), 1);
        newLayer.shapes.push(this);
        oldLayer.invalidate(false);
        newLayer.invalidate(false);
        if (sync) socket.emit("Shape.Floor.Change", { uuid: this.uuid, floor });
    }

    moveLayer(layer: string, sync: boolean): void {
        const oldLayer = layerManager.getLayer(this.floor, this.layer);
        const newLayer = layerManager.getLayer(this.floor, layer);
        if (oldLayer === undefined || newLayer === undefined) return;
        this.layer = layer;
        // Update layer shapes
        oldLayer.shapes.splice(oldLayer.shapes.indexOf(this), 1);
        newLayer.shapes.push(this);
        // Revalidate layers  (light should at most be redone once)
        oldLayer.invalidate(true);
        newLayer.invalidate(false);
        // Sync!
        if (sync) socket.emit("Shape.Layer.Change", { uuid: this.uuid, layer, floor: newLayer.floor });
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
            if (sync) socket.emit("Shape.Owner.Add", ownerToServer(fullOwner));
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
        if (sync) socket.emit("Shape.Owner.Update", ownerToServer(fullOwner));
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
        if (sync) socket.emit("Shape.Owner.Delete", ownerToServer(removed));
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
        if (sync)
            socket.emit("Shape.Owner.Default.Update", { ...accessToServer(this.defaultAccess), shape: this.uuid });
    }

    updatePoints(): void {
        layerManager.getLayer(this.floor, this.layer)?.updateShapePoints(this);
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
}
