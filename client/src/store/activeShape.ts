import { computed, watchEffect } from "vue";
import type { ComputedRef } from "vue";

import type { LocalId } from "../core/id";
import type { Sync } from "../core/models/types";
import { Store } from "../core/store";
import { sendShapeSvgAsset } from "../game/api/emits/shape/options";
import { getGlobalId, getShape } from "../game/id";
import type { IShape } from "../game/interfaces/shape";
import type { IAsset } from "../game/interfaces/shapes/asset";
import type { FloorId } from "../game/models/floor";
import type { ShapeOptions } from "../game/models/shapes";
import type { SHAPE_TYPE } from "../game/shapes/types";
import { accessSystem } from "../game/systems/access";
import { floorSystem } from "../game/systems/floors";
import { selectedState } from "../game/systems/selected/state";
import { visionState } from "../game/vision/state";

interface ActiveShapeState {
    id?: LocalId;
    lastUuid?: LocalId;
    showEditDialog: boolean;
    type: SHAPE_TYPE | undefined;

    options: Partial<ShapeOptions> | undefined;
}

class ActiveShapeStore extends Store<ActiveShapeState> {
    floor: ComputedRef<FloorId | undefined>;

    protected data(): ActiveShapeState {
        return {
            showEditDialog: false,
            type: undefined,

            options: undefined,
        };
    }

    constructor() {
        super();
        this.floor = computed(() => (this._state.id !== undefined ? getShape(this._state.id)?.floorId : undefined));

        watchEffect(() => {
            const selection = selectedState.reactive.selected;
            if (selection.size === 0) {
                this.clear();
            } else if (this._state.id === undefined) {
                this.setActiveShape(getShape([...selection][0]!)!);
            } else {
                let sameMainShape = false;
                for (const sel of selection) {
                    if (this._state.id === sel) {
                        sameMainShape = true;
                        break;
                    }
                }
                if (!sameMainShape) {
                    const showEditDialog = this._state.showEditDialog;
                    activeShapeStore.clear();
                    activeShapeStore.setActiveShape(getShape([...selection][0]!)!);
                    if (showEditDialog) this._state.showEditDialog = showEditDialog;
                }
            }
        });
    }

    // CORE

    setShowEditDialog(visible: boolean): void {
        this._state.showEditDialog = visible;
    }

    // EXTRA

    async setSvgAsset(hash: string | undefined, syncTo: Sync): Promise<void> {
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
                await (shape as IAsset).loadSvgs();
            }
        }

        if (syncTo.server) {
            const shapeId = getGlobalId(shape.id);
            if (shapeId) sendShapeSvgAsset({ shape: shapeId, value: hash ?? null });
        }
    }

    // STARTUP / CLEANUP

    setActiveShape(shape: IShape): void {
        if (this._state.lastUuid === shape.id) this._state.showEditDialog = true;

        this._state.id = shape.id;
        this._state.type = shape.type;

        this._state.options = { ...shape.options };

        accessSystem.loadState(shape.id);
    }

    clear(): void {
        if (this._state.showEditDialog) this._state.lastUuid = this._state.id;
        else this._state.lastUuid = undefined;
        this._state.id = undefined;
        this._state.showEditDialog = false;
        this._state.type = undefined;

        this._state.options = undefined;
    }
}

export const activeShapeStore = new ActiveShapeStore();
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).activeShapeStore = activeShapeStore;
