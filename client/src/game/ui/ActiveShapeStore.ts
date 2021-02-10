/**
 * This is a reactive facade in front of Shape.
 * The current setup causes a bit of code duplication, but this separates the reactive UI aspects from the core game logic.
 *
 * Most of the game shapes will never have a need for being reactive,
 * so the current approach is to use this facade to provide a reactive UI for the active shape.
 *
 * Because this means that things need to be synced between the core Shape and this facade,
 * a SyncTo enum is used to signal direction of events. (i.e. if a change came from the UI or from the core)
 */

import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import { SyncTo } from "../../core/models/types";
import { rootStore } from "../../store";
import { layerManager } from "../layers/manager";
import { Aura, Label, Tracker } from "../shapes/interfaces";
import { ShapeAccess, ShapeOwner } from "../shapes/owners";
import { Shape } from "../shapes/shape";
import { createEmptyUiAura, createEmptyUiTracker } from "../shapes/trackers/empty";
import { ToggleComposite } from "../shapes/variants/togglecomposite";
import { gameStore } from "../store";

export type UiTracker = { shape: string; temporary: boolean } & Tracker;
export type UiAura = { shape: string; temporary: boolean } & Aura;

// Only expose things that should be available on the UI
export interface ActiveShapeState {
    uuid: string | undefined;
    parentUuid: string | undefined;
    isComposite: boolean;
    showEditDialog: boolean;

    name: string | undefined;
    setName(data: { name: string; syncTo: SyncTo }): void;
    nameVisible: boolean;
    setNameVisible(data: { visible: boolean; syncTo: SyncTo }): void;
    isToken: boolean;
    setIsToken(data: { isToken: boolean; syncTo: SyncTo }): void;
    isInvisible: boolean;
    setIsInvisible(data: { isInvisible: boolean; syncTo: SyncTo }): void;
    strokeColour: string | undefined;
    setStrokeColour(data: { colour: string; syncTo: SyncTo }): void;
    fillColour: string | undefined;
    setFillColour(data: { colour: string; syncTo: SyncTo }): void;
    visionObstruction: boolean;
    setVisionObstruction(data: { blocksVision: boolean; syncTo: SyncTo }): void;
    movementObstruction: boolean;
    setMovementObstruction(data: { blocksMovement: boolean; syncTo: SyncTo }): void;
    isLocked: boolean;
    setLocked(data: { isLocked: boolean; syncTo: SyncTo }): void;
    showBadge: boolean;
    setShowBadge(data: { showBadge: boolean; syncTo: SyncTo }): void;

    owners: readonly ShapeOwner[];
    hasEditAccess: boolean;
    hasDefaultEditAccess: boolean;
    hasDefaultMovementAccess: boolean;
    hasDefaultVisionAccess: boolean;
    setDefaultEditAccess(data: { editAccess: boolean; syncTo: SyncTo }): void;
    setDefaultMovementAccess(data: { movementAccess: boolean; syncTo: SyncTo }): void;
    setDefaultVisionAccess(data: { visionAccess: boolean; syncTo: SyncTo }): void;
    addOwner(data: { owner: ShapeOwner; syncTo: SyncTo }): void;
    updateOwner(data: { owner: ShapeOwner; syncTo: SyncTo }): void;
    removeOwner(data: { owner: string; syncTo: SyncTo }): void;

    trackers: readonly UiTracker[];
    pushTracker(data: { tracker: Tracker; shape: string; syncTo: SyncTo }): void;
    updateTracker(data: { tracker: string; delta: Partial<Tracker>; syncTo: SyncTo }): void;
    removeTracker(data: { tracker: string; syncTo: SyncTo }): void;

    auras: readonly UiAura[];
    pushAura(data: { aura: Aura; shape: string; syncTo: SyncTo }): void;
    updateAura(data: { aura: string; delta: Partial<Aura>; syncTo: SyncTo }): void;
    removeAura(data: { aura: string; syncTo: SyncTo }): void;

    groupId: string | undefined;

    annotation: string | undefined;
    setAnnotation(data: { annotation: string; syncTo: SyncTo }): void;
    annotationVisible: boolean;
    setAnnotationVisible(data: { visible: boolean; syncTo: SyncTo }): void;
    labels: readonly Label[];
    addLabel(data: { label: string; syncTo: SyncTo }): void;
    removeLabel(data: { label: string; syncTo: SyncTo }): void;

    variants: readonly { uuid: string; name: string }[];
    renameVariant(data: { uuid: string; name: string; syncTo: SyncTo }): void;
    removeVariant(data: { uuid: string; syncTo: SyncTo }): void;
}

function toUiTrackers(trackers: readonly Tracker[], shape: string): UiTracker[] {
    return trackers.map((tracker) => ({
        shape,
        temporary: false,
        ...tracker,
    }));
}

function toUiAuras(auras: readonly Aura[], shape: string): UiAura[] {
    return auras.map((aura) => ({
        shape,
        temporary: false,
        ...aura,
    }));
}

@Module({ dynamic: true, store: rootStore, name: "activeShape", namespaced: true })
class ActiveShapeStore extends VuexModule implements ActiveShapeState {
    private _uuid: string | null = null;
    private _parentUuid: string | null = null;
    // The last Uuid is used to make sure that the UI remains open when a shape is removed and re-added
    private _lastUuid: string | null = null;
    private _showEditDialog = false;

    private _name: string | null = null;
    private _nameVisible = false;
    private _isToken = false;
    private _isInvisible = false;
    private _strokeColour: string | null = null;
    private _fillColour: string | null = null;
    private _visionObstruction = false;
    private _movementObstruction = false;
    private _isLocked = false;
    private _showBadge = false;

    private _access: ShapeAccess | null = null;
    private _owners: ShapeOwner[] = [];

    private _trackers: UiTracker[] = [];
    private firstRealTrackerIndex = 0;

    private _auras: UiAura[] = [];
    private firstRealAuraIndex = 0;

    private _groupId: string | null = null;

    private _annotation: string | null = null;
    private _annotationVisible = false;
    private _labels: Label[] = [];

    private _variants: { uuid: string; name: string }[] = [];

    // CORE

    get uuid(): string | undefined {
        return this._uuid ?? undefined;
    }

    get parentUuid(): string | undefined {
        return this._parentUuid ?? undefined;
    }

    get lastUuid(): string | undefined {
        return this._lastUuid ?? undefined;
    }

    get isComposite(): boolean {
        return this._parentUuid !== null;
    }

    get showEditDialog(): boolean {
        return this._showEditDialog;
    }

    @Mutation
    setShowEditDialog(visible: boolean): void {
        this._showEditDialog = visible;
    }

    // PROPERTIES

    get name(): string | undefined {
        return this._name ?? undefined;
    }

    @Mutation
    setName(data: { name: string; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._name = data.name;

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.setName(data.name, data.syncTo);
        }
    }

    get nameVisible(): boolean {
        return this._nameVisible;
    }

    @Mutation
    setNameVisible(data: { visible: boolean; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._nameVisible = data.visible;

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.setNameVisible(data.visible, data.syncTo);
        }
    }

    get isToken(): boolean {
        return this._isToken;
    }

    @Mutation
    setIsToken(data: { isToken: boolean; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._isToken = data.isToken;

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.setIsToken(data.isToken, data.syncTo);
        }
    }

    get isInvisible(): boolean {
        return this._isInvisible;
    }

    @Mutation
    setIsInvisible(data: { isInvisible: boolean; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._isInvisible = data.isInvisible;

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.setInvisible(data.isInvisible, data.syncTo);
        }
    }

    get strokeColour(): string | undefined {
        return this._strokeColour ?? undefined;
    }

    @Mutation
    setStrokeColour(data: { colour: string; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._strokeColour = data.colour;

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.setStrokeColour(data.colour, data.syncTo);
        }
    }

    get fillColour(): string | undefined {
        return this._fillColour ?? undefined;
    }

    @Mutation
    setFillColour(data: { colour: string; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._fillColour = data.colour;

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.setFillColour(data.colour, data.syncTo);
        }
    }

    get visionObstruction(): boolean {
        return this._visionObstruction;
    }

    @Mutation
    setVisionObstruction(data: { blocksVision: boolean; syncTo: SyncTo }): void {
        if (this._uuid === null) return;
        this._visionObstruction = data.blocksVision;
        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.setVisionBlock(data.blocksVision, data.syncTo);
        }
    }

    get movementObstruction(): boolean {
        return this._movementObstruction;
    }

    @Mutation
    setMovementObstruction(data: { blocksMovement: boolean; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._movementObstruction = data.blocksMovement;

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.setMovementBlock(data.blocksMovement, data.syncTo);
        }
    }

    get isLocked(): boolean {
        return this._isLocked;
    }

    @Mutation
    setLocked(data: { isLocked: boolean; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._isLocked = data.isLocked;

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.setLocked(data.isLocked, data.syncTo);
        }
    }

    get showBadge(): boolean {
        return this._showBadge;
    }

    @Mutation
    setShowBadge(data: { showBadge: boolean; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._showBadge = data.showBadge;

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.setShowBadge(data.showBadge, data.syncTo);
        }
    }

    // ACCESS

    get owners(): readonly ShapeOwner[] {
        return this._owners;
    }

    get hasEditAccess(): boolean {
        if (this._uuid === null) return false;
        return (
            gameStore.IS_DM ||
            (gameStore.FAKE_PLAYER && gameStore.activeTokens.includes(this._uuid)) ||
            this._access!.edit ||
            this._owners.some((u) => u.user === gameStore.username && u.access.edit === true)
        );
    }

    get hasDefaultEditAccess(): boolean {
        if (this._uuid === null) return false;
        return this._access!.edit;
    }

    get hasDefaultMovementAccess(): boolean {
        if (this._uuid === null) return false;
        return this._access!.movement;
    }

    get hasDefaultVisionAccess(): boolean {
        if (this._uuid === null) return false;
        return this._access!.vision;
    }

    @Mutation
    setDefaultAccess(data: { access: ShapeAccess; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._access = { ...data.access };

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.updateDefaultOwner(this._access, data.syncTo);
        }
    }

    @Mutation
    setDefaultEditAccess(data: { editAccess: boolean; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._access!.edit = data.editAccess;
        if (data.editAccess) {
            this._access!.movement = true;
            this._access!.vision = true;
        }

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.updateDefaultOwner(this._access!, data.syncTo);
        }
    }

    @Mutation
    setDefaultMovementAccess(data: { movementAccess: boolean; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._access!.movement = data.movementAccess;
        if (data.movementAccess) this._access!.vision = true;
        else this._access!.edit = false;

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.updateDefaultOwner(this._access!, data.syncTo);
        }
    }

    @Mutation
    setDefaultVisionAccess(data: { visionAccess: boolean; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._access!.vision = data.visionAccess;
        if (!data.visionAccess) {
            this._access!.movement = false;
            this._access!.edit = false;
        }

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.updateDefaultOwner(this._access!, data.syncTo);
        }
    }

    @Mutation
    addOwner(data: { owner: ShapeOwner; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._owners.push(data.owner);

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.addOwner(data.owner, data.syncTo);
        }
    }

    @Mutation
    updateOwner(data: { owner: ShapeOwner; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        const index = this._owners.findIndex((o) => o.user === data.owner.user);
        if (index < 0) return;

        Object.assign(this._owners[index], data.owner);

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.updateOwner({ ...data.owner, access: { ...data.owner.access } }, data.syncTo);
        }
    }

    @Mutation
    removeOwner(data: { owner: string; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._owners = this._owners.filter((o) => o.user !== data.owner);

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.removeOwner(data.owner, data.syncTo);
        }
    }

    // TRACKERS

    get trackers(): readonly UiTracker[] {
        return this._trackers;
    }

    @Mutation
    pushTracker(data: { tracker: Tracker; shape: string; syncTo: SyncTo }): void {
        if (this._uuid === undefined) return;

        const tracker = toUiTrackers([data.tracker], data.shape)[0];
        if (this._uuid === data.shape) {
            this._trackers.splice(this._trackers.length - 1, 0, tracker);
        } else if (this._parentUuid === data.shape) {
            this._trackers.splice(this.firstRealTrackerIndex, 0, tracker);
            this.firstRealTrackerIndex += 1;
        } else {
            return;
        }
        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(data.shape)!;
            shape.pushTracker(data.tracker, data.syncTo);
        }
    }

    @Mutation
    updateTracker(data: { tracker: string; delta: Partial<Tracker>; syncTo: SyncTo }): void {
        if (this._uuid === undefined) return;

        const tracker = this._trackers.find((t) => t.uuid === data.tracker);
        if (tracker === undefined) return;

        Object.assign(tracker, data.delta);

        const shape = layerManager.UUIDMap.get(tracker.shape);
        if (shape === undefined) return;

        if (data.syncTo !== SyncTo.UI) {
            if (tracker.temporary) {
                tracker.temporary = false;
                shape.pushTracker(tracker, SyncTo.SERVER);
                this._trackers.push(createEmptyUiTracker(this._uuid!));
            } else {
                shape.updateTracker(data.tracker, data.delta, data.syncTo);
            }
        }
    }

    @Mutation
    removeTracker(data: { tracker: string; syncTo: SyncTo }): void {
        if (this._uuid === undefined) return;

        const trackerIndex = this._trackers.findIndex((t) => t.uuid === data.tracker);
        if (trackerIndex < 0) return;

        const tracker = this._trackers.splice(trackerIndex, 1)[0];
        if (trackerIndex < this.firstRealTrackerIndex) {
            this.firstRealTrackerIndex -= 1;
        }

        const shape = layerManager.UUIDMap.get(tracker.shape);
        if (shape === undefined) return;

        if (data.syncTo !== SyncTo.UI) shape.removeTracker(data.tracker, data.syncTo);
    }

    // AURAS

    get auras(): readonly UiAura[] {
        return this._auras;
    }

    @Mutation
    pushAura(data: { aura: Aura; shape: string; syncTo: SyncTo }): void {
        if (this._uuid === undefined) return;

        const aura = toUiAuras([data.aura], data.shape)[0];
        if (this._uuid === data.shape) {
            this._auras.splice(this._auras.length - 1, 0, aura);
        } else if (this._parentUuid === data.shape) {
            this._auras.splice(this.firstRealAuraIndex, 0, aura);
            this.firstRealAuraIndex += 1;
        } else {
            return;
        }
        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(data.shape)!;
            shape.pushAura(data.aura, data.syncTo);
        }
    }

    @Mutation
    updateAura(data: { aura: string; delta: Partial<Aura>; syncTo: SyncTo }): void {
        if (this._uuid === undefined) return;

        const aura = this._auras.find((a) => a.uuid === data.aura);
        if (aura === undefined) return;

        Object.assign(aura, data.delta);

        const shape = layerManager.UUIDMap.get(aura.shape);
        if (shape === undefined) return;

        if (data.syncTo !== SyncTo.UI) {
            if (aura.temporary) {
                aura.temporary = false;
                shape.pushAura(aura, SyncTo.SERVER);
                this._auras.push(createEmptyUiAura(this._uuid!));
            } else {
                shape.updateAura(data.aura, data.delta, data.syncTo);
            }
        }
    }

    @Mutation
    removeAura(data: { aura: string; syncTo: SyncTo }): void {
        if (this._uuid === undefined) return;

        const auraIndex = this._auras.findIndex((t) => t.uuid === data.aura);
        if (auraIndex < 0) return;

        const aura = this._auras.splice(auraIndex, 1)[0];
        if (auraIndex < this.firstRealAuraIndex) {
            this.firstRealAuraIndex -= 1;
        }

        const shape = layerManager.UUIDMap.get(aura.shape);
        if (shape === undefined) return;

        if (data.syncTo !== SyncTo.UI) shape.removeAura(data.aura, data.syncTo);
    }

    // GROUP

    get groupId(): string | undefined {
        return this._groupId ?? undefined;
    }

    // EXTRA

    get annotation(): string | undefined {
        return this._annotation ?? undefined;
    }

    @Mutation
    setAnnotation(data: { annotation: string; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._annotation = data.annotation;

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.setAnnotation(data.annotation, data.syncTo);
        }
    }

    get annotationVisible(): boolean {
        return this._annotationVisible;
    }

    @Mutation
    setAnnotationVisible(data: { visible: boolean; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._annotationVisible = data.visible;

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.setAnnotationVisible(data.visible, data.syncTo);
        }
    }

    get labels(): readonly Label[] {
        return this._labels;
    }

    @Mutation
    addLabel(data: { label: string; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._labels.push({ ...gameStore.labels[data.label] });

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.addLabel(data.label, data.syncTo);
        }
    }

    @Mutation
    removeLabel(data: { label: string; syncTo: SyncTo }): void {
        if (this._uuid === null) return;

        this._labels = this._labels.filter((l) => l.uuid !== data.label);

        if (data.syncTo !== SyncTo.UI) {
            const shape = layerManager.UUIDMap.get(this._uuid)!;
            shape.removeLabel(data.label, data.syncTo);
        }
    }

    // VARIANTS

    get variants(): readonly { uuid: string; name: string }[] {
        return this._variants;
    }

    @Mutation
    renameVariant(data: { uuid: string; name: string; syncTo: SyncTo }): void {
        if (this._uuid === null || this._parentUuid === null) return;

        const variant = this._variants.find((v) => v.uuid === data.uuid);
        if (variant === undefined) return;

        variant.name = data.name;

        if (data.syncTo !== SyncTo.UI) {
            const parent = layerManager.UUIDMap.get(this._parentUuid) as ToggleComposite;
            parent.renameVariant(data.uuid, data.name, data.syncTo);
        }
    }

    @Mutation
    removeVariant(data: { uuid: string; syncTo: SyncTo }): void {
        if (this._uuid === null || this._parentUuid === null) return;

        const index = this._variants.findIndex((v) => v.uuid === data.uuid);
        if (index < 0) return;

        this._variants.splice(index, 1);

        if (data.syncTo !== SyncTo.UI) {
            const parent = layerManager.UUIDMap.get(this._parentUuid) as ToggleComposite;
            parent.removeVariant(data.uuid, data.syncTo);
        }
    }

    // STARTUP / CLEANUP

    // It is crucial that this method does not make the original Shape properties observable
    @Mutation
    setActiveShape(shape: Shape): void {
        if (this._lastUuid === shape.uuid) this._showEditDialog = true;

        this._uuid = shape.uuid;
        const parent = layerManager.getCompositeParent(shape.uuid);
        this._parentUuid = parent?.uuid ?? null;

        this._name = shape.name;
        this._nameVisible = shape.nameVisible;
        this._isToken = shape.isToken;
        this._isInvisible = shape.isInvisible;
        this._strokeColour = shape.strokeColour;
        this._fillColour = shape.fillColour;
        this._visionObstruction = shape.visionObstruction;
        this._movementObstruction = shape.movementObstruction;
        this._isLocked = shape.isLocked;
        this._showBadge = shape.showBadge;

        this._access = { ...shape.defaultAccess };
        this._owners = shape.owners.map((o) => ({ ...o, access: { ...o.access } }));

        this._trackers = [];
        this._auras = [];
        if (parent !== undefined) {
            this._trackers.push(...toUiTrackers(parent.getTrackers(false), parent.uuid));
            this.firstRealTrackerIndex = this._trackers.length;
            this._auras.push(...toUiAuras(parent.getAuras(false), parent.uuid));
            this.firstRealAuraIndex = this._auras.length;
        }
        this._trackers.push(...toUiTrackers(shape.getTrackers(false), shape.uuid));
        this._trackers.push(createEmptyUiTracker(this._uuid));
        this._auras.push(...toUiAuras(shape.getAuras(false), shape.uuid));
        this._auras.push(createEmptyUiAura(this._uuid));

        this._groupId = shape.groupId ?? null;

        this._annotation = shape.annotation;
        this._annotationVisible = shape.annotationVisible;
        this._labels = [...shape.labels];

        if (this._parentUuid) {
            const composite = layerManager.UUIDMap.get(this._parentUuid) as ToggleComposite;
            this._variants = composite.variants.map((v) => ({ ...v }));
        }
    }

    @Mutation
    clear(): void {
        if (this._showEditDialog) this._lastUuid = this._uuid;
        else this._lastUuid = null;

        this._uuid = null;
        this._parentUuid = null;

        this._name = null;
        this._nameVisible = false;
        this._isToken = false;
        this._isInvisible = false;
        this._strokeColour = null;
        this._fillColour = null;
        this._visionObstruction = false;
        this._movementObstruction = false;
        this._isLocked = false;
        this._showBadge = false;

        this._access = null;
        this._owners = [];

        this.firstRealTrackerIndex = 0;
        this._trackers = [];

        this.firstRealAuraIndex = 0;
        this._auras = [];

        this._groupId = null;

        this._annotation = null;
        this._annotationVisible = false;
        this._labels = [];

        this._variants = [];

        this._showEditDialog = false;
    }
}

export const activeShapeStore = getModule(ActiveShapeStore);
