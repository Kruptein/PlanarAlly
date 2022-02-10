import type { GlobalPoint } from "../../../core/geometry";
import { SyncTo, SyncMode } from "../../../core/models/types";
import { gameStore } from "../../../store/game";
import { IdMap } from "../../../store/shapeMap";
import { sendShapePositionUpdate, sendShapeOptionsUpdate } from "../../api/emits/shape/core";
import {
    sendToggleCompositeActiveVariant,
    sendToggleCompositeRemoveVariant,
    sendToggleCompositeRenameVariant,
} from "../../api/emits/shape/toggleComposite";
import { selectionState } from "../../layers/selection";
import { compositeState } from "../../layers/state";
import type { ServerToggleComposite } from "../../models/shapes";
import { TriangulationTarget, visionState } from "../../vision/state";
import type { GlobalId, LocalId } from "../localId";
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
            strokeColour?: string;
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

    renameVariant(uuid: LocalId, name: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER)
            sendToggleCompositeRenameVariant({ shape: this.uuid, variant: IdMap.get(uuid)!.uuid, name });
        if (syncTo === SyncTo.UI) this._("renameVariant")(uuid, name, syncTo);

        const variant = this._variants.find((v) => v.uuid === uuid);
        if (variant === undefined) return;
        variant.name = name;
    }

    removeVariant(id: LocalId, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER)
            sendToggleCompositeRemoveVariant({ shape: this.uuid, variant: IdMap.get(id)!.uuid });
        if (syncTo === SyncTo.UI) this._("removeVariant")(id, syncTo);

        const v = this._variants.findIndex((v) => v.uuid === id);
        if (v === undefined) {
            console.error("Variant not found during variant removal");
            return;
        }
        const newVariant = this._variants[(v + 1) % this._variants.length].uuid;
        this._variants.splice(v, 1);
        this.setActiveVariant(newVariant, true);

        const oldVariant = IdMap.get(id)!;
        oldVariant.layer.removeShape(oldVariant, SyncMode.FULL_SYNC, true);
    }

    private resetVariants(...variants: LocalId[]): void {
        for (const variantId of variants) {
            const variant = IdMap.get(variantId);
            if (variant === undefined) continue;

            if (variant.isToken) gameStore.removeOwnedToken(variant.id);
            if (variant.blocksMovement)
                visionState.removeBlocker(TriangulationTarget.MOVEMENT, variant.floor.id, variant, true);
            if (variant.blocksVision)
                visionState.removeBlocker(TriangulationTarget.VISION, variant.floor.id, variant, true);
            if (variant.getAuras(false).length > 0) visionState.removeVisionSources(variant.floor.id, variant.id);
        }
    }

    setActiveVariant(variant: LocalId, sync: boolean): void {
        const oldVariant = IdMap.get(this.active_variant)!;
        this.resetVariants(this.active_variant);
        this.active_variant = variant;
        const newVariant = IdMap.get(this.active_variant)!;

        if (newVariant.isToken && newVariant.ownedBy(false, { visionAccess: true }))
            gameStore.addOwnedToken(newVariant.id);
        if (newVariant.blocksMovement)
            visionState.addBlocker(TriangulationTarget.MOVEMENT, newVariant.id, newVariant.floor.id, true);
        if (newVariant.blocksVision)
            visionState.addBlocker(TriangulationTarget.VISION, newVariant.id, newVariant.floor.id, true);

        for (const au of newVariant.getAuras(false)) {
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
            sendShapeOptionsUpdate([oldVariant, newVariant], false);
            sendToggleCompositeActiveVariant({ shape: this.uuid, variant: IdMap.get(variant)!.uuid });
        }

        if (this._layer !== undefined && this.layer.isActiveLayer) {
            const selection = [...selectionState.get({ includeComposites: false })];
            const index = selection.findIndex((s) => s.uuid === oldVariant.uuid);
            if (index >= 0) {
                selection.splice(index, 1, newVariant);
                selectionState.set(...selection);
            }
        }

        newVariant.invalidate(false);
    }

    asDict(): ServerToggleComposite {
        return Object.assign(this.getBaseDict(), {
            active_variant: IdMap.get(this.active_variant)!.uuid,
            variants: this._variants.map((v) => ({ uuid: IdMap.get(v.uuid)!.uuid, name: v.name })),
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
        if (centerPoint === undefined) return IdMap.get(this.active_variant)!.center();
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
