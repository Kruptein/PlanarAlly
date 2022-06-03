import { computed, watchEffect } from "vue";
import type { ComputedRef } from "vue";

import type { Sync } from "../core/models/types";
import { Store } from "../core/store";
import { sendShapeSvgAsset } from "../game/api/emits/shape/options";
import { getGlobalId, getShape } from "../game/id";
import type { LocalId } from "../game/id";
import { selectionState } from "../game/layers/selection";
import { compositeState } from "../game/layers/state";
import type { FloorId } from "../game/models/floor";
import type { ShapeOptions } from "../game/models/shapes";
import type { IShape, Label } from "../game/shapes/interfaces";
import type { SHAPE_TYPE } from "../game/shapes/types";
import type { Asset } from "../game/shapes/variants/asset";
import type { ToggleComposite } from "../game/shapes/variants/toggleComposite";
import { visionState } from "../game/vision/state";

import { floorStore } from "./floor";
import { gameStore } from "./game";

interface ActiveShapeState {
    id?: LocalId;
    lastUuid?: LocalId;
    parentUuid?: LocalId;
    showEditDialog: boolean;
    type: SHAPE_TYPE | undefined;

    options: Partial<ShapeOptions> | undefined;

    groupId: string | undefined;

    name: string | undefined;
    nameVisible: boolean;
    isToken: boolean;
    isInvisible: boolean;
    strokeColour: string[] | undefined;
    fillColour: string | undefined;
    blocksMovement: boolean;
    blocksVision: boolean;
    showBadge: boolean;
    isDefeated: boolean;
    isLocked: boolean;

    variants: { uuid: LocalId; name: string }[];

    annotation: string | undefined;
    annotationVisible: boolean;
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

            variants: [],

            annotation: undefined,
            annotationVisible: false,
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

    // PROPERTIES

    setName(name: string, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.name = name;

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setName(name, syncTo);
        }
    }

    setNameVisible(visible: boolean, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.nameVisible = visible;

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setNameVisible(visible, syncTo);
        }
    }

    setIsToken(isToken: boolean, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.isToken = isToken;

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setIsToken(isToken, syncTo);
        }
    }

    setIsInvisible(isInvisible: boolean, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.isInvisible = isInvisible;

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setInvisible(isInvisible, syncTo);
        }
    }

    setStrokeColour(colour: string, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.strokeColour = [colour];

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setStrokeColour(colour, syncTo);
        }
    }

    setFillColour(colour: string, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.fillColour = colour;

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setFillColour(colour, syncTo);
        }
    }

    setBlocksMovement(blocksMovement: boolean, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.blocksMovement = blocksMovement;

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setBlocksMovement(blocksMovement, syncTo);
        }
    }

    setBlocksVision(blocksVision: boolean, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.blocksVision = blocksVision;
        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setBlocksVision(blocksVision, syncTo);
        }
    }

    setShowBadge(showBadge: boolean, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.showBadge = showBadge;

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setShowBadge(showBadge, syncTo);
        }
    }

    setIsDefeated(isDefeated: boolean, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.isDefeated = isDefeated;

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setDefeated(isDefeated, syncTo);
        }
    }

    setLocked(isLocked: boolean, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.isLocked = isLocked;

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setLocked(isLocked, syncTo);
        }
    }

    // VARIANTS

    renameVariant(uuid: LocalId, name: string, syncTo: Sync): void {
        if (this._state.id === undefined || this._state.parentUuid === undefined) return;

        const variant = this._state.variants.find((v) => v.uuid === uuid);
        if (variant === undefined) return;

        variant.name = name;

        if (!syncTo.ui) {
            const parent = getShape(this._state.parentUuid) as ToggleComposite;
            parent.renameVariant(uuid, name, syncTo);
        }
    }

    removeVariant(uuid: LocalId, syncTo: Sync): void {
        if (this._state.id === undefined || this._state.parentUuid === undefined) return;

        const index = this._state.variants.findIndex((v) => v.uuid === uuid);
        if (index < 0) return;

        this._state.variants.splice(index, 1);

        if (!syncTo.ui) {
            const parent = getShape(this._state.parentUuid) as ToggleComposite;
            parent.removeVariant(uuid, syncTo);
        }
    }

    // EXTRA

    setAnnotation(annotation: string, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.annotation = annotation;

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setAnnotation(annotation, syncTo);
        }
    }

    setAnnotationVisible(visible: boolean, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.annotationVisible = visible;

        if (!syncTo.ui) {
            const shape = getShape(this._state.id)!;
            shape.setAnnotationVisible(visible, syncTo);
        }
    }

    addLabel(label: string, syncTo: Sync): void {
        if (this._state.id === undefined) return;

        this._state.labels.push({ ...gameStore.state.labels.get(label)! });

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
                floorStore.invalidate({ id: activeShapeStore.floor.value! });
            } else {
                shape.options.svgAsset = hash;
                (shape as Asset).loadSvgs();
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

        this._state.annotation = shape.annotation;
        this._state.annotationVisible = shape.annotationVisible;
        this._state.labels = [...shape.labels];

        if (this._state.parentUuid !== undefined) {
            const composite = getShape(this._state.parentUuid) as ToggleComposite;
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

        this._state.variants = [];

        this._state.annotation = undefined;
        this._state.annotationVisible = false;
        this._state.labels = [];
    }
}

export const activeShapeStore = new ActiveShapeStore();
(window as any).activeShapeStore = activeShapeStore;
