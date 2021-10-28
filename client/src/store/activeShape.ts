import { computed, watchEffect } from "vue";
import type { ComputedRef } from "vue";

import { SyncTo } from "../core/models/types";
import { Store } from "../core/store";
import { selectionState } from "../game/layers/selection";
import { compositeState } from "../game/layers/state";
import type { ShapeOptions } from "../game/models/shapes";
import type { Aura, IShape, Label, Tracker } from "../game/shapes/interfaces";
import type { ShapeAccess, ShapeOwner } from "../game/shapes/owners";
import { createEmptyUiAura, createEmptyUiTracker } from "../game/shapes/trackers";
import type { SHAPE_TYPE } from "../game/shapes/types";
import type { ToggleComposite } from "../game/shapes/variants/toggleComposite";

import { clientStore } from "./client";
import { gameStore } from "./game";
import { UuidMap } from "./shapeMap";

export type UiTracker = { shape: string; temporary: boolean } & Tracker;
export type UiAura = { shape: string; temporary: boolean } & Aura;

function toUiTrackers(trackers: readonly Tracker[], shape: string): UiTracker[] {
    return trackers.map((tracker) => ({
        ...tracker,
        shape,
        temporary: false,
    }));
}

function toUiAuras(auras: readonly Aura[], shape: string): UiAura[] {
    return auras.map((aura) => ({
        ...aura,
        shape,
        temporary: false,
    }));
}

interface ActiveShapeState {
    uuid?: string;
    lastUuid?: string;
    parentUuid?: string;
    showEditDialog: boolean;
    type: SHAPE_TYPE | undefined;

    options: Partial<ShapeOptions> | undefined;

    groupId: string | undefined;

    name: string | undefined;
    nameVisible: boolean;
    isToken: boolean;
    isInvisible: boolean;
    strokeColour: string | undefined;
    fillColour: string | undefined;
    blocksMovement: boolean;
    blocksVision: boolean;
    showBadge: boolean;
    isDefeated: boolean;
    isLocked: boolean;

    access: ShapeAccess | undefined;
    owners: ShapeOwner[];

    firstRealTrackerIndex: number;
    trackers: UiTracker[];
    firstRealAuraIndex: number;
    auras: UiAura[];

    variants: { uuid: string; name: string }[];

    annotation: string | undefined;
    annotationVisible: boolean;
    labels: Label[];
}

export class ActiveShapeStore extends Store<ActiveShapeState> {
    floor: ComputedRef<number | undefined>;
    isComposite: ComputedRef<boolean>;

    hasEditAccess: ComputedRef<boolean>;
    hasDefaultEditAccess: ComputedRef<boolean>;
    hasDefaultMovementAccess: ComputedRef<boolean>;
    hasDefaultVisionAccess: ComputedRef<boolean>;

    protected data(): ActiveShapeState {
        return {
            showEditDialog: false,
            type: undefined,

            options: undefined,

            groupId: undefined,

            name: undefined,
            nameVisible: false,
            isToken: false,
            isInvisible: false,
            strokeColour: undefined,
            fillColour: undefined,
            blocksMovement: false,
            blocksVision: false,
            showBadge: false,
            isDefeated: false,
            isLocked: false,

            access: undefined,
            owners: [],

            firstRealTrackerIndex: 0,
            trackers: [],
            firstRealAuraIndex: 0,
            auras: [],

            variants: [],

            annotation: undefined,
            annotationVisible: false,
            labels: [],
        };
    }

    constructor() {
        super();
        this.floor = computed(() =>
            this._state.uuid !== undefined ? UuidMap.get(this._state.uuid)?.floor.id : undefined,
        );
        this.isComposite = computed(() => this._state.parentUuid !== undefined);

        this.hasEditAccess = computed(() => {
            if (this._state.uuid === undefined) return false;
            const gameState = gameStore.state;
            if (gameState.isDm) return true;
            if (gameState.isFakePlayer && gameStore.activeTokens.value.has(this._state.uuid)) return true;
            if (this._state.access?.edit === true) return true;
            return this._state.owners.some((u) => u.user === clientStore.state.username && u.access.edit === true);
        });

        this.hasDefaultEditAccess = computed(() => this._state.access?.edit ?? false);

        this.hasDefaultMovementAccess = computed(() => this._state.access?.movement ?? false);

        this.hasDefaultVisionAccess = computed(() => this._state.access?.vision ?? false);

        watchEffect(() => {
            const selection = selectionState.state.selection;
            if (selection.size === 0) {
                this.clear();
            } else if (this._state.uuid === undefined) {
                this.setActiveShape(UuidMap.get([...selection][0])!);
            } else {
                let sameMainShape = false;
                for (const sel of selection) {
                    if ([this._state.uuid, this._state.parentUuid].includes(sel)) {
                        sameMainShape = true;
                        break;
                    }
                }
                if (!sameMainShape) {
                    const showEditDialog = this._state.showEditDialog;
                    activeShapeStore.clear();
                    activeShapeStore.setActiveShape(UuidMap.get([...selection][0])!);
                    if (showEditDialog) this._state.showEditDialog = showEditDialog;
                }
            }
        });
    }

    // CORE

    setShowEditDialog(visible: boolean): void {
        this._state.showEditDialog = visible;
    }

    // OPTIONS

    setOptions(options: Partial<ShapeOptions>, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.options = options;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setOptions(this._state.options, SyncTo.SERVER);
        }
    }

    // GROUP

    setGroupId(groupId: string | undefined, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.groupId = groupId;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setGroupId(groupId, syncTo);
        }
    }

    // PROPERTIES

    setName(name: string, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.name = name;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setName(name, syncTo);
        }
    }

    setNameVisible(visible: boolean, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.nameVisible = visible;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setNameVisible(visible, syncTo);
        }
    }

    setIsToken(isToken: boolean, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.isToken = isToken;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setIsToken(isToken, syncTo);
        }
    }

    setIsInvisible(isInvisible: boolean, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.isInvisible = isInvisible;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setInvisible(isInvisible, syncTo);
        }
    }

    setStrokeColour(colour: string, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.strokeColour = colour;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setStrokeColour(colour, syncTo);
        }
    }

    setFillColour(colour: string, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.fillColour = colour;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setFillColour(colour, syncTo);
        }
    }

    setBlocksMovement(blocksMovement: boolean, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.blocksMovement = blocksMovement;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setBlocksMovement(blocksMovement, syncTo);
        }
    }

    setBlocksVision(blocksVision: boolean, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.blocksVision = blocksVision;
        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setBlocksVision(blocksVision, syncTo);
        }
    }

    setShowBadge(showBadge: boolean, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.showBadge = showBadge;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setShowBadge(showBadge, syncTo);
        }
    }

    setIsDefeated(isDefeated: boolean, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.isDefeated = isDefeated;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setDefeated(isDefeated, syncTo);
        }
    }

    setLocked(isLocked: boolean, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.isLocked = isLocked;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setLocked(isLocked, syncTo);
        }
    }

    // ACCESS

    setDefaultAccess(access: ShapeAccess, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.access = { ...access };

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.updateDefaultOwner(this._state.access, syncTo);
        }
    }

    setDefaultEditAccess(editAccess: boolean, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.access!.edit = editAccess;
        if (editAccess) {
            this._state.access!.movement = true;
            this._state.access!.vision = true;
        }

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.updateDefaultOwner(this._state.access!, syncTo);
        }
    }

    setDefaultMovementAccess(movementAccess: boolean, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.access!.movement = movementAccess;
        if (movementAccess) this._state.access!.vision = true;
        else this._state.access!.edit = false;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.updateDefaultOwner(this._state.access!, syncTo);
        }
    }

    setDefaultVisionAccess(visionAccess: boolean, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.access!.vision = visionAccess;
        if (!visionAccess) {
            this._state.access!.movement = false;
            this._state.access!.edit = false;
        }

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.updateDefaultOwner(this._state.access!, syncTo);
        }
    }

    addOwner(owner: ShapeOwner, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.owners.push(owner);

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.addOwner(owner, syncTo);
        }
    }

    updateOwner(owner: ShapeOwner, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        const index = this._state.owners.findIndex((o) => o.user === owner.user);
        if (index < 0) return;

        Object.assign(this._state.owners[index], owner);

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.updateOwner({ ...owner, access: { ...owner.access } }, syncTo);
        }
    }

    removeOwner(owner: string, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.owners = this._state.owners.filter((o) => o.user !== owner);

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.removeOwner(owner, syncTo);
        }
    }

    // TRACKERS

    pushTracker(tracker: Tracker, shape: string, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        const tr = toUiTrackers([tracker], shape)[0];
        if (this._state.uuid === shape) {
            this._state.trackers.splice(this._state.trackers.length - 1, 0, tr);
        } else if (this._state.parentUuid === shape) {
            this._state.trackers.splice(this._state.firstRealTrackerIndex, 0, tr);
            this._state.firstRealTrackerIndex += 1;
        } else {
            return;
        }
        if (syncTo !== SyncTo.UI) {
            const sh = UuidMap.get(shape);
            if (sh === undefined) return;

            sh.pushTracker(tracker, syncTo);
        }
    }

    updateTracker(trackerId: string, delta: Partial<Tracker>, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        const tracker = this._state.trackers.find((t) => t.uuid === trackerId);
        if (tracker === undefined) return;

        Object.assign(tracker, delta);

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(tracker.shape);
            if (shape === undefined) return;

            if (tracker.temporary) {
                tracker.temporary = false;
                shape.pushTracker(tracker, SyncTo.SERVER);
                this._state.trackers.push(createEmptyUiTracker(this._state.uuid!));
            } else {
                shape.updateTracker(trackerId, delta, syncTo);
            }
        }
    }

    removeTracker(tracker: string, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        const trackerIndex = this._state.trackers.findIndex((t) => t.uuid === tracker);
        if (trackerIndex < 0) return;

        const tr = this._state.trackers.splice(trackerIndex, 1)[0];
        if (trackerIndex < this._state.firstRealTrackerIndex) {
            this._state.firstRealTrackerIndex -= 1;
        }

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(tr.shape);
            if (shape === undefined) return;
            shape.removeTracker(tracker, syncTo);
        }
    }

    setTrackerShape(trackerId: string, shape: string): void {
        const tracker = this._state.trackers.find((t) => t.uuid === trackerId);
        if (tracker !== undefined) {
            tracker.shape = shape;
        }
    }

    // AURAS

    pushAura(aura: Aura, shape: string, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        const uiAura = toUiAuras([aura], shape)[0];
        if (this._state.uuid === shape) {
            this._state.auras.splice(this._state.auras.length - 1, 0, uiAura);
        } else if (this._state.parentUuid === shape) {
            this._state.auras.splice(this._state.firstRealAuraIndex, 0, uiAura);
            this._state.firstRealAuraIndex += 1;
        } else {
            return;
        }
        if (syncTo !== SyncTo.UI) {
            const sh = UuidMap.get(shape)!;
            sh.pushAura(aura, syncTo);
        }
    }

    updateAura(auraId: string, delta: Partial<Aura>, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        const aura = this._state.auras.find((a) => a.uuid === auraId);
        if (aura === undefined) return;

        Object.assign(aura, delta);

        const shape = UuidMap.get(aura.shape);
        if (shape === undefined) return;

        if (syncTo !== SyncTo.UI) {
            if (aura.temporary) {
                aura.temporary = false;
                shape.pushAura(aura, SyncTo.SERVER);
                this._state.auras.push(createEmptyUiAura(this._state.uuid!));
            } else {
                shape.updateAura(auraId, delta, syncTo);
            }
        }
    }

    removeAura(auraId: string, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        const auraIndex = this._state.auras.findIndex((t) => t.uuid === auraId);
        if (auraIndex < 0) return;

        const aura = this._state.auras.splice(auraIndex, 1)[0];
        if (auraIndex < this._state.firstRealAuraIndex) {
            this._state.firstRealAuraIndex -= 1;
        }

        const shape = UuidMap.get(aura.shape);
        if (shape === undefined) return;

        if (syncTo !== SyncTo.UI) shape.removeAura(auraId, syncTo);
    }

    setAuraShape(auraId: string, shape: string): void {
        const aura = this._state.auras.find((a) => a.uuid === auraId);
        if (aura !== undefined) {
            aura.shape = shape;
        }
    }

    // VARIANTS

    renameVariant(uuid: string, name: string, syncTo: SyncTo): void {
        if (this._state.uuid === undefined || this._state.parentUuid === undefined) return;

        const variant = this._state.variants.find((v) => v.uuid === uuid);
        if (variant === undefined) return;

        variant.name = name;

        if (syncTo !== SyncTo.UI) {
            const parent = UuidMap.get(this._state.parentUuid) as ToggleComposite;
            parent.renameVariant(uuid, name, syncTo);
        }
    }

    removeVariant(uuid: string, syncTo: SyncTo): void {
        if (this._state.uuid === undefined || this._state.parentUuid === undefined) return;

        const index = this._state.variants.findIndex((v) => v.uuid === uuid);
        if (index < 0) return;

        this._state.variants.splice(index, 1);

        if (syncTo !== SyncTo.UI) {
            const parent = UuidMap.get(this._state.parentUuid) as ToggleComposite;
            parent.removeVariant(uuid, syncTo);
        }
    }

    // EXTRA

    setAnnotation(annotation: string, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.annotation = annotation;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setAnnotation(annotation, syncTo);
        }
    }

    setAnnotationVisible(visible: boolean, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.annotationVisible = visible;

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.setAnnotationVisible(visible, syncTo);
        }
    }

    addLabel(label: string, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.labels.push({ ...gameStore.state.labels.get(label)! });

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.addLabel(label, syncTo);
        }
    }

    removeLabel(label: string, syncTo: SyncTo): void {
        if (this._state.uuid === undefined) return;

        this._state.labels = this._state.labels.filter((l) => l.uuid !== label);

        if (syncTo !== SyncTo.UI) {
            const shape = UuidMap.get(this._state.uuid)!;
            shape.removeLabel(label, syncTo);
        }
    }

    // STARTUP / CLEANUP

    setActiveShape(shape: IShape): void {
        if (this._state.lastUuid === shape.uuid) this._state.showEditDialog = true;

        this._state.uuid = shape.uuid;
        const parent = compositeState.getCompositeParent(shape.uuid);
        this._state.parentUuid = parent?.uuid;
        this._state.type = shape.type;

        this._state.options = { ...shape.options };

        this._state.groupId = shape.groupId;

        this._state.name = shape.name;
        this._state.nameVisible = shape.nameVisible;
        this._state.isToken = shape.isToken;
        this._state.isInvisible = shape.isInvisible;
        this._state.strokeColour = shape.strokeColour;
        this._state.fillColour = shape.fillColour;
        this._state.showBadge = shape.showBadge;
        this._state.blocksMovement = shape.blocksMovement;
        this._state.blocksVision = shape.blocksVision;
        this._state.isDefeated = shape.isDefeated;
        this._state.isLocked = shape.isLocked;

        this._state.access = { ...shape.defaultAccess };
        this._state.owners = shape.owners.map((o) => ({ ...o, access: { ...o.access } }));

        if (parent !== undefined) {
            this._state.trackers.push(...toUiTrackers(parent.getTrackers(false), parent.uuid));
            this._state.firstRealTrackerIndex = this._state.trackers.length;
            this._state.auras.push(...toUiAuras(parent.getAuras(false), parent.uuid));
            this._state.firstRealAuraIndex = this._state.auras.length;
        }
        this._state.trackers.push(...toUiTrackers(shape.getTrackers(false), shape.uuid));
        this._state.trackers.push(createEmptyUiTracker(this._state.uuid));
        this._state.auras.push(...toUiAuras(shape.getAuras(false), shape.uuid));
        this._state.auras.push(createEmptyUiAura(this._state.uuid));

        this._state.annotation = shape.annotation;
        this._state.annotationVisible = shape.annotationVisible;
        this._state.labels = [...shape.labels];

        if (this._state.parentUuid !== undefined) {
            const composite = UuidMap.get(this._state.parentUuid) as ToggleComposite;
            this._state.variants = composite.variants.map((v) => ({ ...v }));
        }
    }

    clear(): void {
        if (this._state.showEditDialog) this._state.lastUuid = this._state.uuid;
        else this._state.lastUuid = undefined;
        this._state.uuid = undefined;
        this._state.parentUuid = undefined;
        this._state.showEditDialog = false;
        this._state.type = undefined;

        this._state.access = undefined;
        this._state.options = undefined;

        this._state.groupId = undefined;

        this._state.name = undefined;
        this._state.nameVisible = false;
        this._state.isToken = false;
        this._state.isInvisible = false;
        this._state.strokeColour = undefined;
        this._state.fillColour = undefined;
        this._state.isLocked = false;
        this._state.blocksMovement = false;
        this._state.blocksVision = false;
        this._state.showBadge = false;
        this._state.isDefeated = false;

        this._state.owners = [];

        this._state.firstRealTrackerIndex = 0;
        this._state.trackers = [];
        this._state.firstRealAuraIndex = 0;
        this._state.auras = [];

        this._state.variants = [];

        this._state.annotation = undefined;
        this._state.annotationVisible = false;
        this._state.labels = [];
    }
}

export const activeShapeStore = new ActiveShapeStore();
(window as any).activeShapeStore = activeShapeStore;
