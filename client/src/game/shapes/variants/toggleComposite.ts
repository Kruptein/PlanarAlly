import { GlobalPoint } from "../../../core/geometry";
import { SyncTo, SyncMode } from "../../../core/models/types";
import { gameStore } from "../../../store/game";
import { UuidMap } from "../../../store/shapeMap";
import { sendShapePositionUpdate, sendShapeOptionsUpdate } from "../../api/emits/shape/core";
import {
    sendToggleCompositeActiveVariant,
    sendToggleCompositeRemoveVariant,
    sendToggleCompositeRenameVariant,
} from "../../api/emits/shape/toggleComposite";
import { selectionState } from "../../layers/selection";
import { compositeState } from "../../layers/state";
import { ServerToggleComposite } from "../../models/shapes";
import { TriangulationTarget, visionState } from "../../vision/state";
import { Shape } from "../shape";
import { SHAPE_TYPE } from "../types";

import { BoundingRect } from "./boundingRect";

export class ToggleComposite extends Shape {
    type: SHAPE_TYPE = "togglecomposite";

    constructor(
        position: GlobalPoint,
        private active_variant: string,
        private _variants: { uuid: string; name: string }[],
        options?: {
            fillColour?: string;
            strokeColour?: string;
            uuid?: string;
        },
    ) {
        super(position, options);
        this.options.set("skipDraw", true);
        for (const variant of _variants) {
            compositeState.addComposite(this.uuid, variant, false);
        }
        this.resetVariants(...this._variants.map((v) => v.uuid));
        this.setActiveVariant(this.active_variant, false);
    }

    get isClosed(): boolean {
        return true;
    }

    get variants(): readonly { uuid: string; name: string }[] {
        return this._variants;
    }

    addVariant(uuid: string, name: string, sync: boolean): void {
        const variant = { uuid, name };
        this._variants.push(variant);
        compositeState.addComposite(this.uuid, variant, sync);
    }

    renameVariant(uuid: string, name: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendToggleCompositeRenameVariant({ shape: this.uuid, variant: uuid, name });
        if (syncTo === SyncTo.UI) this._("renameVariant")(uuid, name, syncTo);

        const variant = this._variants.find((v) => v.uuid === uuid);
        if (variant === undefined) return;
        variant.name = name;
    }

    removeVariant(uuid: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendToggleCompositeRemoveVariant({ shape: this.uuid, variant: uuid });
        if (syncTo === SyncTo.UI) this._("removeVariant")(uuid, syncTo);

        const v = this._variants.findIndex((v) => v.uuid === uuid);
        if (v === undefined) {
            console.error("Variant not found during variant removal");
            return;
        }
        const newVariant = this._variants[(v + 1) % this._variants.length].uuid;
        this._variants.splice(v, 1);
        this.setActiveVariant(newVariant, true);

        const oldVariant = UuidMap.get(uuid)!;
        oldVariant.layer.removeShape(oldVariant, SyncMode.FULL_SYNC, true);
    }

    private resetVariants(...variants: string[]): void {
        for (const variantId of variants) {
            const variant = UuidMap.get(variantId);
            if (variant === undefined) continue;

            if (variant.isToken) gameStore.removeOwnedToken(variant.uuid);
            if (variant.blocksMovement)
                visionState.removeBlocker(TriangulationTarget.MOVEMENT, variant.floor.id, variant, true);
            if (variant.blocksVision)
                visionState.removeBlocker(TriangulationTarget.VISION, variant.floor.id, variant, true);
            if (variant.getAuras(false).length > 0) visionState.removeVisionSources(variant.floor.id, variant.uuid);
        }
    }

    setActiveVariant(variant: string, sync: boolean): void {
        const oldVariant = UuidMap.get(this.active_variant)!;
        this.resetVariants(this.active_variant);
        this.active_variant = variant;
        const newVariant = UuidMap.get(this.active_variant)!;

        if (newVariant.isToken && newVariant.ownedBy(false, { visionAccess: true }))
            gameStore.addOwnedToken(newVariant.uuid);
        if (newVariant.blocksMovement)
            visionState.addBlocker(TriangulationTarget.MOVEMENT, newVariant.uuid, newVariant.floor.id, true);
        if (newVariant.blocksVision)
            visionState.addBlocker(TriangulationTarget.VISION, newVariant.uuid, newVariant.floor.id, true);

        for (const au of newVariant.getAuras(false)) {
            if (au.visionSource && au.active) {
                visionState.addVisionSource({ shape: newVariant.uuid, aura: au.uuid }, newVariant.floor.id);
            }
        }

        if (sync) {
            oldVariant.options.set("skipDraw", true);
            const oldCenter = oldVariant.center();
            newVariant.options.delete("skipDraw");
            newVariant.center(oldCenter);

            sendShapePositionUpdate([newVariant], false);
            sendShapeOptionsUpdate([oldVariant, newVariant], false);
            sendToggleCompositeActiveVariant({ shape: this.uuid, variant });
        }

        const selection = [...selectionState.get({ includeComposites: false })];
        const index = selection.findIndex((s) => s.uuid === oldVariant.uuid);
        if (index >= 0) {
            selection.splice(index, 1, newVariant);
            selectionState.set(...selection);
        }

        newVariant.invalidate(false);
    }

    asDict(): ServerToggleComposite {
        return Object.assign(this.getBaseDict(), {
            active_variant: this.active_variant,
            variants: this._variants,
        });
    }

    get points(): number[][] {
        return [];
    }

    getBoundingBox(): BoundingRect {
        return new BoundingRect(this.refPoint, 5, 5);
    }

    draw(_ctx: CanvasRenderingContext2D): void {
        // no-op
    }

    contains(_point: GlobalPoint): boolean {
        return false;
    }

    center(): GlobalPoint;
    center(centerPoint: GlobalPoint): void;
    center(centerPoint?: GlobalPoint): GlobalPoint | void {
        if (centerPoint === undefined) return UuidMap.get(this.active_variant)!.center();
        this.refPoint = centerPoint;
    }

    visibleInCanvas(canvas: HTMLCanvasElement, options: { includeAuras: boolean }): boolean {
        if (super.visibleInCanvas(canvas, options)) return true;
        return this.getBoundingBox().visibleInCanvas(canvas);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    snapToGrid(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    resizeToGrid(): void {}
    resize(resizePoint: number, _point: GlobalPoint): number {
        return resizePoint;
    }
}
