import type { GlobalPoint } from "../../../core/geometry";
import { SyncMode } from "../../../core/models/types";
import type { Sync } from "../../../core/models/types";
import { gameStore } from "../../../store/game";
import { sendShapePositionUpdate } from "../../api/emits/shape/core";
import { sendShapeSkipDraw } from "../../api/emits/shape/options";
import {
    sendToggleCompositeActiveVariant,
    sendToggleCompositeRemoveVariant,
    sendToggleCompositeRenameVariant,
} from "../../api/emits/shape/toggleComposite";
import { getGlobalId, getShape } from "../../id";
import type { GlobalId, LocalId } from "../../id";
import { selectionState } from "../../layers/selection";
import { compositeState } from "../../layers/state";
import type { ServerToggleComposite } from "../../models/shapes";
import { accessSystem } from "../../systems/access";
import { auraSystem } from "../../systems/auras";
import { TriangulationTarget, visionState } from "../../vision/state";
import { Shape } from "../shape";
import type { SHAPE_TYPE } from "../types";

import { BoundingRect } from "./boundingRect";

export class ToggleComposite extends Shape {
    type: SHAPE_TYPE = "togglecomposite";

    constructor(
        position: GlobalPoint,
        private active_variant: LocalId,
        private _variants: { uuid: LocalId; name: string }[],
        options?: {
            fillColour?: string;
            strokeColour?: string[];
            id?: LocalId;
            uuid?: GlobalId;
        },
    ) {
        super(position, options);
        this.options.skipDraw = true;
        for (const variant of _variants) {
            compositeState.addComposite(this.id, variant, false);
        }
        this.resetVariants(...this._variants.map((v) => v.uuid));
        this.setActiveVariant(this.active_variant, false);
    }

    get isClosed(): boolean {
        return true;
    }

    get variants(): readonly { uuid: LocalId; name: string }[] {
        return this._variants;
    }

    addVariant(uuid: LocalId, name: string, sync: boolean): void {
        const variant = { uuid, name };
        this._variants.push(variant);
        compositeState.addComposite(this.id, variant, sync);
    }

    renameVariant(uuid: LocalId, name: string, syncTo: Sync): void {
        if (syncTo.server)
            sendToggleCompositeRenameVariant({ shape: getGlobalId(this.id), variant: getGlobalId(uuid), name });
        if (syncTo.ui) this._("renameVariant")(uuid, name, syncTo);

        const variant = this._variants.find((v) => v.uuid === uuid);
        if (variant === undefined) return;
        variant.name = name;
    }

    removeVariant(id: LocalId, syncTo: Sync): void {
        if (syncTo.server) sendToggleCompositeRemoveVariant({ shape: getGlobalId(this.id), variant: getGlobalId(id) });
        if (syncTo.ui) this._("removeVariant")(id, syncTo);

        const v = this._variants.findIndex((v) => v.uuid === id);
        if (v === undefined) {
            console.error("Variant not found during variant removal");
            return;
        }
        const newVariant = this._variants[(v + 1) % this._variants.length].uuid;
        this._variants.splice(v, 1);
        this.setActiveVariant(newVariant, true);

        const oldVariant = getShape(id)!;
        oldVariant.layer.removeShape(oldVariant, { sync: SyncMode.FULL_SYNC, recalculate: true, dropShapeId: true });
    }

    private resetVariants(...variants: LocalId[]): void {
        for (const variantId of variants) {
            const variant = getShape(variantId);
            if (variant === undefined) continue;

            if (variant.isToken) gameStore.removeOwnedToken(variant.id);
            if (variant.blocksMovement)
                visionState.removeBlocker(TriangulationTarget.MOVEMENT, variant.floor.id, variant, true);
            if (variant.blocksVision)
                visionState.removeBlocker(TriangulationTarget.VISION, variant.floor.id, variant, true);
            if (auraSystem.getAll(variant.id, false).length > 0)
                visionState.removeVisionSources(variant.floor.id, variant.id);
        }
    }

    setActiveVariant(variant: LocalId, sync: boolean): void {
        const oldVariant = getShape(this.active_variant);
        if (oldVariant === undefined) {
            console.error("COULD NOT FIND OLD VARIANT!");
            return;
        }
        this.resetVariants(this.active_variant);
        this.active_variant = variant;
        const newVariant = getShape(this.active_variant);
        if (newVariant === undefined) {
            console.error("COULD NOT FIND NEW VARIANT!");
            return;
        }

        if (newVariant.isToken && accessSystem.hasAccessTo(newVariant.id, false, { vision: true }))
            gameStore.addOwnedToken(newVariant.id);
        if (newVariant.blocksMovement)
            visionState.addBlocker(TriangulationTarget.MOVEMENT, newVariant.id, newVariant.floor.id, true);
        if (newVariant.blocksVision)
            visionState.addBlocker(TriangulationTarget.VISION, newVariant.id, newVariant.floor.id, true);

        for (const au of auraSystem.getAll(newVariant.id, false)) {
            if (au.visionSource && au.active) {
                visionState.addVisionSource({ shape: newVariant.id, aura: au.uuid }, newVariant.floor.id);
            }
        }

        if (sync) {
            oldVariant.options.skipDraw = true;
            const oldCenter = oldVariant.center();
            delete newVariant.options.skipDraw;
            newVariant.center(oldCenter);

            sendShapePositionUpdate([newVariant], false);
            sendShapeSkipDraw({ shape: getGlobalId(oldVariant.id), value: true });
            sendShapeSkipDraw({ shape: getGlobalId(newVariant.id), value: false });
            sendToggleCompositeActiveVariant({ shape: getGlobalId(this.id), variant: getGlobalId(variant) });
        }

        if (this._layer !== undefined && this.layer.isActiveLayer) {
            const selection = [...selectionState.get({ includeComposites: false })];
            const index = selection.findIndex((s) => s.id === oldVariant.id);
            if (index >= 0) {
                selection.splice(index, 1, newVariant);
                selectionState.set(...selection);
            }
        }

        newVariant.invalidate(false);
    }

    asDict(): ServerToggleComposite {
        return Object.assign(this.getBaseDict(), {
            active_variant: getGlobalId(this.active_variant)!,
            variants: this._variants.map((v) => ({ uuid: getGlobalId(v.uuid)!, name: v.name })),
        });
    }

    invalidatePoints(): void {
        return;
    }

    getBoundingBox(): BoundingRect {
        return new BoundingRect(this.refPoint, 5, 5);
    }

    draw(_ctx: CanvasRenderingContext2D): void {
        return;
    }

    contains(_point: GlobalPoint): boolean {
        return false;
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        if (centerPoint === undefined) return getShape(this.active_variant)!.center();
        this.refPoint = centerPoint;
    }

    visibleInCanvas(max: { w: number; h: number }, options: { includeAuras: boolean }): boolean {
        if (super.visibleInCanvas(max, options)) return true;
        return this.getBoundingBox().visibleInCanvas(max);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    snapToGrid(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    resizeToGrid(): void {}
    resize(resizePoint: number, _point: GlobalPoint): number {
        return resizePoint;
    }
}
