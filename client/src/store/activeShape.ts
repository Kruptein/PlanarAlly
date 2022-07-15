import { computed, watchEffect } from "vue";
import type { ComputedRef } from "vue";

import type { Sync } from "../core/models/types";
import { Store } from "../core/store";
import { sendShapeSvgAsset } from "../game/api/emits/shape/options";
import { getGlobalId, getShape } from "../game/id";
import type { LocalId } from "../game/id";
import type { Label } from "../game/interfaces/label";
import type { IShape } from "../game/interfaces/shape";
import type { IAsset } from "../game/interfaces/shapes/asset";
import type { IToggleComposite } from "../game/interfaces/shapes/toggleComposite";
import { selectionState } from "../game/layers/selection";
import { compositeState } from "../game/layers/state";
import type { FloorId } from "../game/models/floor";
import type { ShapeOptions } from "../game/models/shapes";
import type { SHAPE_TYPE } from "../game/shapes/types";
import { floorSystem } from "../game/systems/floors";
import { visionState } from "../game/vision/state";

import { getGameState } from "./_game";

interface ActiveShapeState {
    id?: LocalId;
    lastUuid?: LocalId;
    parentUuid?: LocalId;
    showEditDialog: boolean;
    type: SHAPE_TYPE | undefined;

    options: Partial<ShapeOptions> | undefined;

    groupId: string | undefined;

    variants: { uuid: LocalId; name: string }[];

    labels: Label[];
}

export class ActiveShapeStore extends Store<ActiveShapeState> {
    floor: ComputedRef<FloorId | undefined>;
    isComposite: ComputedRef<boolean>;

    protected data(): ActiveShapeState {
        return {
            showEditDialog: false,
            type: undefined,

            options: undefined,

            groupId: undefined,

            variants: [],

            labels: [],
        };
    }

    constructor() {
        super();
        this.floor = computed(() => (this._state.id !== undefined ? getShape(this._state.id)?.floor.id : undefined));
        this.isComposite = computed(() => this._state.parentUuid !== undefined);

        watchEffect(() => {
            const selection = selectionState.state.selection;
            if (selection.size === 0) {
                this.clear();
            } else if (this._state.id === undefined) {
                this.setActiveShape(getShape([...selection][0])!);
            } else {
                let sameMainShape = false;
                for (const sel of selection) {
                    if ([this._state.id, this._state.parentUuid].includes(sel)) {
                        sameMainShape = true;
                        break;
                    }
                }
                if (!sameMainShape) {
                    const showEditDialog = this._state.showEditDialog;
                    activeShapeStore.clear();
                    activeShapeStore.setActiveShape(getShape([...selection][0])!);
                    if (showEditDialog) this._state.showEditDialog = showEditDialog;
                }
            }
        });
    }

    // CORE

    setShowEditDialog(visible: boolean): void {
        this._state.showEditDialog = visible;
    }

    // GROUP

    setGroupId(groupId: string | undefined, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.groupId = groupId;

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setGroupId(groupId, syncTo);
        }
    }

    // VARIANTS

    renameVariant(uuid: LocalId, name: string, syncTo: Sync): void {
        if (this._state.id === undefined || this._state.parentUuid === undefined) return;

        const variant = this._state.variants.find((v) => v.uuid === uuid);
        if (variant === undefined) return;

        variant.name = name;

        if (!syncTo.ui) {
            const parent = getShape(this._state.parentUuid) as IToggleComposite;
            parent.renameVariant(uuid, name, syncTo);
        }
    }

    removeVariant(uuid: LocalId, syncTo: Sync): void {
        if (this._state.id === undefined || this._state.parentUuid === undefined) return;

        const index = this._state.variants.findIndex((v) => v.uuid === uuid);
        if (index < 0) return;

        this._state.variants.splice(index, 1);

        if (!syncTo.ui) {
            const parent = getShape(this._state.parentUuid) as IToggleComposite;
            parent.removeVariant(uuid, syncTo);
        }
    }

    // EXTRA

    addLabel(label: string, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.labels.push({ ...getGameState().labels.get(label)! });

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.addLabel(label, syncTo);
        }
    }

    removeLabel(label: string, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.labels = this._state.labels.filter((l) => l.uuid !== label);

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.removeLabel(label, syncTo);
        }
    }

    setSvgAsset(hash: string | undefined, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        if (this._state.options === undefined) this._state.options = {};

        this._state.options.svgAsset = hash;

        const shape = getShape(this._state.id)!;

        if (!syncTo.ui) {
            if (hash === undefined) {
                visionState.recalculateVision(activeShapeStore.floor.value!);
                floorSystem.invalidate({ id: activeShapeStore.floor.value! });
            } else {
                shape.options.svgAsset = hash;
                (shape as IAsset).loadSvgs();
            }
        }

        if (syncTo.server) {
            sendShapeSvgAsset({ shape: getGlobalId(shape.id), value: hash ?? null });
        }
    }

    // STARTUP / CLEANUP

    setActiveShape(shape: IShape): void {
        if (this._state.lastUuid === shape.id) this._state.showEditDialog = true;

        this._state.id = shape.id;
        const parent = compositeState.getCompositeParent(shape.id);
        this._state.parentUuid = parent?.id;
        this._state.type = shape.type;

        this._state.options = { ...shape.options };

        this._state.groupId = shape.groupId;

        this._state.labels = [...shape.labels];

        if (this._state.parentUuid !== undefined) {
            const composite = getShape(this._state.parentUuid) as IToggleComposite;
            this._state.variants = composite.variants.map((v) => ({ ...v }));
        }
    }

    clear(): void {
        if (this._state.showEditDialog) this._state.lastUuid = this._state.id;
        else this._state.lastUuid = undefined;
        this._state.id = undefined;
        this._state.parentUuid = undefined;
        this._state.showEditDialog = false;
        this._state.type = undefined;

        this._state.options = undefined;

        this._state.groupId = undefined;

        this._state.variants = [];

        this._state.labels = [];
    }
}

export const activeShapeStore = new ActiveShapeStore();
(window as any).activeShapeStore = activeShapeStore;
