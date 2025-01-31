import { exportShapeData } from "..";
import type { ApiToggleCompositeShape } from "../../../apiTypes";
import type { GlobalPoint } from "../../../core/geometry";
import type { GlobalId, LocalId } from "../../../core/id";
import { SyncMode } from "../../../core/models/types";
import type { Sync } from "../../../core/models/types";
import { activeShapeStore } from "../../../store/activeShape";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { sendShapeSkipDraw } from "../../api/emits/shape/options";
import {
    sendToggleCompositeActiveVariant,
    sendToggleCompositeRemoveVariant,
    sendToggleCompositeRenameVariant,
} from "../../api/emits/shape/toggleComposite";
import { getGlobalId, getShape } from "../../id";
import type { IToggleComposite } from "../../interfaces/shapes/toggleComposite";
import { compositeState } from "../../layers/state";
import { accessSystem } from "../../systems/access";
import { auraSystem } from "../../systems/auras";
import { getProperties } from "../../systems/properties/state";
import type { ShapeProperties } from "../../systems/properties/state";
import { VisionBlock } from "../../systems/properties/types";
import { selectedSystem } from "../../systems/selected";
import { TriangulationTarget, visionState } from "../../vision/state";
import { Shape } from "../shape";
import type { SHAPE_TYPE } from "../types";

import { BoundingRect } from "./simple/boundingRect";

export class ToggleComposite extends Shape implements IToggleComposite {
    type: SHAPE_TYPE = "togglecomposite";

    constructor(
        position: GlobalPoint,
        private active_variant: LocalId,
        private _variants: { id: LocalId; name: string }[],
        options?: {
            id?: LocalId;
            uuid?: GlobalId;
        },
        properties?: Partial<ShapeProperties>,
    ) {
        super(position, options, properties);
        this.options.skipDraw = true;
        for (const variant of _variants) {
            compositeState.addComposite(this.id, variant, false);
        }
        this.resetVariants(...this._variants.map((v) => v.id));
        this.setActiveVariant(this.active_variant, false);
    }

    readonly isClosed = true;

    get variants(): readonly { id: LocalId; name: string }[] {
        return this._variants;
    }

    get activeVariant(): LocalId {
        return this.active_variant;
    }

    addVariant(id: LocalId, name: string, sync: boolean): void {
        const variant = { id, name };
        this._variants.push(variant);
        compositeState.addComposite(this.id, variant, sync);
    }

    renameVariant(uuid: LocalId, name: string, syncTo: Sync): void {
        const shape = getGlobalId(this.id);
        const variantId = getGlobalId(uuid);

        if (shape === undefined || variantId === undefined) {
            console.error("Variant globalid mismatch");
            return;
        }

        if (syncTo.server) sendToggleCompositeRenameVariant({ shape, variant: variantId, name });
        if (syncTo.ui) {
            if (this.id === activeShapeStore.state.id) activeShapeStore.renameVariant(uuid, name, syncTo);
        }

        const variant = this._variants.find((v) => v.id === uuid);
        if (variant === undefined) return;
        variant.name = name;
    }

    removeVariant(id: LocalId, syncTo: Sync): void {
        const shape = getGlobalId(this.id);
        const variantId = getGlobalId(id);

        if (shape === undefined || variantId === undefined) {
            console.error("Variant globalid mismatch");
            return;
        }

        if (syncTo.server) sendToggleCompositeRemoveVariant({ shape, variant: variantId });
        if (syncTo.ui) {
            if (this.id === activeShapeStore.state.id) activeShapeStore.removeVariant(id, syncTo);
        }

        const v = this._variants.findIndex((v) => v.id === id);
        if (v === -1) {
            console.error("Variant not found during variant removal");
            return;
        }
        const newVariant = this._variants[(v + 1) % this._variants.length]!.id;
        this._variants.splice(v, 1);
        this.setActiveVariant(newVariant, true);

        const oldVariant = getShape(id)!;
        oldVariant.layer?.removeShape(oldVariant, { sync: SyncMode.FULL_SYNC, recalculate: true, dropShapeId: true });
    }

    private resetVariants(...variants: LocalId[]): void {
        for (const variantId of variants) {
            const variant = getShape(variantId);
            const props = getProperties(variantId);
            if (variant === undefined || props === undefined) continue;

            if (variant.floorId !== undefined) {
                if (props.isToken) accessSystem.removeOwnedToken(variant.id);
                if (props.blocksMovement)
                    visionState.removeBlocker(TriangulationTarget.MOVEMENT, variant.floorId, variant, true);
                if (props.blocksVision !== VisionBlock.No)
                    visionState.removeBlocker(TriangulationTarget.VISION, variant.floorId, variant, true);
                if (auraSystem.getAll(variant.id, false).length > 0)
                    visionState.removeVisionSources(variant.floorId, variant.id);
            }
        }
    }

    setActiveVariant(variant: LocalId, sync: boolean): void {
        const oldVariant = getShape(this.active_variant);
        if (oldVariant === undefined) {
            console.error("COULD NOT FIND OLD VARIANT!");
            return;
        }
        const gIdOldShape = getGlobalId(oldVariant.id);

        const newVariant = getShape(variant);
        if (newVariant === undefined) {
            console.error("COULD NOT FIND NEW VARIANT!");
            return;
        }
        const gIdNewShape = getGlobalId(newVariant.id);

        const gId = getGlobalId(this.id);
        if (gId === undefined || gIdOldShape === undefined || gIdNewShape === undefined) {
            console.error("Globalid mismatch in variant switching");
            return;
        }

        this.resetVariants(this.active_variant);
        this.active_variant = variant;

        const props = getProperties(newVariant.id)!;

        if (props.isToken && accessSystem.hasAccessTo(newVariant.id, false, { vision: true }))
            accessSystem.addOwnedToken(newVariant.id);

        if (newVariant.floorId !== undefined) {
            if (props.blocksMovement)
                visionState.addBlocker(TriangulationTarget.MOVEMENT, newVariant.id, newVariant.floorId, true);
            if (props.blocksVision !== VisionBlock.No)
                visionState.addBlocker(TriangulationTarget.VISION, newVariant.id, newVariant.floorId, true);

            for (const au of auraSystem.getAll(newVariant.id, false)) {
                if (au.visionSource && au.active) {
                    visionState.addVisionSource({ shape: newVariant.id, aura: au.uuid }, newVariant.floorId);
                }
            }
        }

        if (sync) {
            oldVariant.options.skipDraw = true;
            const oldCenter = oldVariant.center;
            delete newVariant.options.skipDraw;
            newVariant.center = oldCenter;

            sendShapePositionUpdate([newVariant], false);
            sendShapeSkipDraw({ shape: gIdOldShape, value: true });
            sendShapeSkipDraw({ shape: gIdNewShape, value: false });
            sendToggleCompositeActiveVariant({ shape: gId, variant: gIdNewShape });
        }

        if (this.layerName !== undefined && (this.layer?.isActiveLayer ?? false)) {
            const selection = [...selectedSystem.get({ includeComposites: false })];
            const index = selection.findIndex((s) => s.id === oldVariant.id);
            if (index >= 0) {
                selection.splice(index, 1, newVariant);
                selectedSystem.set(...selection.map((s) => s.id));
            }
        }

        newVariant.invalidate(false);
    }

    asDict(): ApiToggleCompositeShape {
        return {
            ...exportShapeData(this),
            active_variant: getGlobalId(this.active_variant)!,
            variants: this._variants.map((v) => ({ uuid: getGlobalId(v.id)!, name: v.name })),
        };
    }

    updatePoints(): void {
        return;
    }

    getAABB(delta = 0): BoundingRect {
        return new BoundingRect(this.refPoint, 5, 5);
    }

    draw(_ctx: CanvasRenderingContext2D): void {
        return;
    }

    contains(_point: GlobalPoint): boolean {
        return false;
    }

    __center(): GlobalPoint {
        try {
            return getShape(this.active_variant)!.center;
        } catch (e) {
            console.error(e);
            return this.refPoint;
        }
    }

    get center(): GlobalPoint {
        return this.__center();
    }

    set center(centerPoint: GlobalPoint) {
        this.refPoint = centerPoint;
    }

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean {
        if (super.visibleInCanvas(max, options)) return true;
        return this.getBoundingBox().visibleInCanvas(max);
    }

    resize(resizePoint: number, _point: GlobalPoint): number {
        return resizePoint;
    }
}
