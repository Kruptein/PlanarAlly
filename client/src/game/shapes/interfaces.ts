import type { GlobalPoint, Vector } from "../../core/geometry";
import type { SyncTo } from "../../core/models/types";
import type { PartialBy } from "../../core/types";
import type { LocalId } from "../id";
import type { Layer } from "../layers/variants/layer";
import type { Floor, LayerName } from "../models/floor";
import type { ServerShape, ShapeOptions } from "../models/shapes";

import type { PartialShapeOwner, ShapeAccess, ShapeOwner } from "./owners";
import type { SHAPE_TYPE } from "./types";
import type { BoundingRect } from "./variants/boundingRect";

export interface IShape {
    readonly type: SHAPE_TYPE;
    readonly id: LocalId;

    get points(): [number, number][];
    invalidatePoints(): void;

    contains(point: GlobalPoint, nearbyThreshold?: number): boolean;

    snapToGrid(): void;
    resizeToGrid(resizePoint: number, retainAspectRatio: boolean): void;
    resize(resizePoint: number, point: GlobalPoint, retainAspectRatio: boolean): number;

    name: string;
    nameVisible: boolean;

    isToken: boolean;
    isInvisible: boolean;
    isDefeated: boolean;
    isLocked: boolean;

    fillColour: string;
    strokeColour: string;
    strokeWidth: number;

    assetId?: number;
    groupId?: string;

    blocksVision: boolean;
    blocksMovement: boolean;

    globalCompositeOperation: string;

    labels: Label[];

    defaultAccess: ShapeAccess;

    annotation: string;
    annotationVisible: boolean;

    badge: number;
    showBadge: boolean;

    showHighlight: boolean;

    ignoreZoomSize: boolean;

    preventSync: boolean;

    options: Partial<ShapeOptions>;

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;

    get isClosed(): boolean;

    get triggersVisionRecalc(): boolean;

    onLayerAdd(): void;

    // POSITION

    get floor(): Floor;
    get layer(): Layer;
    get refPoint(): GlobalPoint;
    set refPoint(point: GlobalPoint);
    get angle(): number;
    set angle(angle: number);
    setLayer(floor: number, layer: LayerName): void;
    getPositionRepresentation(): { angle: number; points: [number, number][] };
    setPositionRepresentation(position: { angle: number; points: [number, number][] }): void;
    invalidate(skipLightUpdate: boolean): void;
    updateLayerPoints(): void;
    rotateAround(point: GlobalPoint, angle: number): void;
    rotateAroundAbsolute(point: GlobalPoint, angle: number): void;
    getPointIndex(p: GlobalPoint, delta?: number): number;
    getPointOrientation(i: number): Vector;

    // DRAWING

    draw(ctx: CanvasRenderingContext2D): void;
    drawPost(ctx: CanvasRenderingContext2D): void;
    drawSelection(ctx: CanvasRenderingContext2D): void;

    // VISION

    updateShapeVision(alteredMovement: boolean, alteredVision: boolean): void;

    // BOUNDING BOX

    getAABB(delta?: number): BoundingRect;
    getBoundingBox(delta?: number): BoundingRect;

    // STATE

    asDict(): ServerShape;
    getBaseDict(): ServerShape;
    fromDict(data: ServerShape): void;

    // UTILITY

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean;

    // GROUP

    setGroupId(groupId: string | undefined, syncTo: SyncTo): void;

    // PROPERTIES

    setName(name: string, syncTo: SyncTo): void;
    setNameVisible(visible: boolean, syncTo: SyncTo): void;
    setIsToken(isToken: boolean, syncTo: SyncTo): void;
    setInvisible(isInvisible: boolean, syncTo: SyncTo): void;
    setStrokeColour(colour: string, syncTo: SyncTo): void;
    setFillColour(colour: string, syncTo: SyncTo): void;
    setBlocksVision(blocksVision: boolean, syncTo: SyncTo, recalculate?: boolean): void;
    setBlocksMovement(blocksMovement: boolean, syncTo: SyncTo, recalculate?: boolean): boolean;
    setShowBadge(showBadge: boolean, syncTo: SyncTo): void;
    setDefeated(isDefeated: boolean, syncTo: SyncTo): void;
    setLocked(isLocked: boolean, syncTo: SyncTo): void;

    // ACCESS

    get owners(): readonly ShapeOwner[];
    ownedBy(
        limitToActiveTokens: boolean,
        options: Partial<{ editAccess: boolean; visionAccess: boolean; movementAccess: boolean }>,
    ): boolean;
    updateDefaultOwner(access: ShapeAccess, syncTo: SyncTo): void;
    hasOwner(username: string): boolean;
    addOwner(owner: PartialBy<PartialShapeOwner, "shape">, syncTo: SyncTo): void;
    updateOwner(owner: PartialBy<ShapeOwner, "shape">, syncTo: SyncTo): void;
    removeOwner(owner: string, syncTo: SyncTo): void;

    // TRACKERS

    getTrackers(includeParent: boolean): readonly Tracker[];
    pushTracker(tracker: Tracker, syncTo: SyncTo): void;
    updateTracker(trackerId: string, delta: Partial<Tracker>, syncTo: SyncTo): void;
    removeTracker(tracker: string, syncTo: SyncTo): void;

    // AURAS

    getAuras(includeParent: boolean): readonly Aura[];
    pushAura(aura: Aura, syncTo: SyncTo): void;
    updateAura(auraId: string, delta: Partial<Aura>, syncTo: SyncTo): void;
    removeAura(aura: string, syncTo: SyncTo): void;

    // EXTRA

    setAnnotation(text: string, syncTo: SyncTo): void;
    setAnnotationVisible(visible: boolean, syncTo: SyncTo): void;
    addLabel(label: string, syncTo: SyncTo): void;
    removeLabel(label: string, syncTo: SyncTo): void;
}

export interface Tracker {
    uuid: string;
    visible: boolean;
    name: string;
    value: number;
    maxvalue: number;
    draw: boolean;
    primaryColor: string;
    secondaryColor: string;
}

export interface Aura {
    uuid: string;
    active: boolean;
    visionSource: boolean;
    visible: boolean;
    name: string;
    value: number;
    dim: number;
    colour: string;
    borderColour: string;
    angle: number;
    direction: number;
    lastPath?: Path2D;
}

export interface Label {
    uuid: string;
    category: string;
    name: string;
    visible: boolean;
    user: string;
}
