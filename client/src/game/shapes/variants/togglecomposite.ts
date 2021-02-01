import { GlobalPoint } from "@/game/geom";
import { Shape } from "@/game/shapes/shape";
import { BoundingRect } from "@/game/shapes/variants/boundingrect";

import { SyncMode, SyncTo } from "../../../core/comm/types";
import { sendShapeOptionsUpdate, sendShapePositionUpdate } from "../../api/emits/shape/core";
import {
    sendToggleCompositeActiveVariant,
    sendToggleCompositeRemoveVariant,
    sendToggleCompositeRenameVariant,
} from "../../api/emits/shape/togglecomposite";
import { ServerToggleComposite } from "../../comm/types/shapes";
import { layerManager } from "../../layers/manager";
import { gameStore } from "../../store";
import { activeShapeStore } from "../../ui/ActiveShapeStore";
import { TriangulationTarget } from "../../visibility/te/pa";
import { addBlocker, addVisionSource, removeBlocker, removeVisionSources } from "../../visibility/utils";
import { SHAPE_TYPE } from "../types";

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
            layerManager.addComposite(this.uuid, variant, false);
        }
        this.resetVariants(...this._variants.map((v) => v.uuid));
        this.setActiveVariant(this.active_variant, false);
    }

    get variants(): readonly { uuid: string; name: string }[] {
        return this._variants;
    }

    addVariant(uuid: string, name: string, sync: boolean): void {
        const variant = { uuid, name };
        this._variants.push(variant);
        layerManager.addComposite(this.uuid, variant, sync);
    }

    renameVariant(uuid: string, name: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendToggleCompositeRenameVariant({ shape: this.uuid, variant: uuid, name });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.renameVariant, { uuid, name, syncTo });

        const variant = this._variants.find((v) => v.uuid === uuid);
        if (variant === undefined) return;
        variant.name = name;
    }

    removeVariant(uuid: string, syncTo: SyncTo): void {
        if (syncTo === SyncTo.SERVER) sendToggleCompositeRemoveVariant({ shape: this.uuid, variant: uuid });
        if (syncTo === SyncTo.UI) this._(activeShapeStore.removeVariant, { uuid, syncTo });

        const v = this._variants.findIndex((v) => v.uuid === uuid);
        if (v === undefined) {
            console.error("Variant not found during variant removal");
            return;
        }
        const newVariant = this._variants[(v + 1) % this._variants.length].uuid;
        this._variants.splice(v, 1);
        this.setActiveVariant(newVariant, true);

        const oldVariant = layerManager.UUIDMap.get(uuid)!;
        oldVariant.layer.removeShape(oldVariant, SyncMode.FULL_SYNC, true);
    }

    private resetVariants(...variants: string[]): void {
        for (const variantId of variants) {
            const variant = layerManager.UUIDMap.get(variantId);
            if (variant === undefined) continue;

            if (variant.isToken) gameStore.removeOwnedToken(variant.uuid);
            if (variant.movementObstruction)
                removeBlocker(TriangulationTarget.MOVEMENT, variant.floor.id, variant, true);
            if (variant.visionObstruction) removeBlocker(TriangulationTarget.VISION, variant.floor.id, variant, true);
            if (variant.getAuras(false).length > 0) removeVisionSources(variant.floor.id, variant.uuid);
        }
    }

    setActiveVariant(variant: string, sync: boolean): void {
        const oldVariant = layerManager.UUIDMap.get(this.active_variant)!;
        this.resetVariants(this.active_variant);
        this.active_variant = variant;
        const newVariant = layerManager.UUIDMap.get(this.active_variant)!;

        if (newVariant.isToken) gameStore.addOwnedToken(newVariant.uuid);
        if (newVariant.movementObstruction)
            addBlocker(TriangulationTarget.MOVEMENT, newVariant.uuid, newVariant.floor.id, true);
        if (newVariant.visionObstruction)
            addBlocker(TriangulationTarget.VISION, newVariant.uuid, newVariant.floor.id, true);

        for (const au of newVariant.getAuras(false)) {
            if (au.visionSource && au.active) {
                addVisionSource({ shape: newVariant.uuid, aura: au.uuid }, newVariant.floor.id);
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

        const selection = [...newVariant.layer.getSelection({ includeComposites: false })];
        const index = selection.findIndex((s) => s.uuid === oldVariant.uuid);
        if (index >= 0) {
            selection.splice(index, 1, newVariant);
            newVariant.layer.setSelection(...selection);
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
        if (centerPoint === undefined) return layerManager.UUIDMap.get(this.active_variant)!.center();
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
