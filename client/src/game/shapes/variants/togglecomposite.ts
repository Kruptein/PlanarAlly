import { GlobalPoint } from "@/game/geom";
import { Shape } from "@/game/shapes/shape";
import { BoundingRect } from "@/game/shapes/variants/boundingrect";
import { sendShapeOptionsUpdate, sendShapePositionUpdate } from "../../api/emits/shape/core";
import {
    sendToggleCompositeActiveVariant,
    sendToggleCompositeRemoveVariant,
    sendToggleCompositeRenameVariant,
} from "../../api/emits/shape/togglecomposite";
import { ServerToggleComposite } from "../../comm/types/shapes";
import { layerManager } from "../../layers/manager";
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
        for (const variant of _variants) {
            layerManager.addComposite(this.uuid, variant, false);
        }
    }

    get variants(): readonly { uuid: string; name: string }[] {
        return this._variants;
    }

    addVariant(uuid: string, name: string, sync: boolean): void {
        const variant = { uuid, name };
        this._variants.push(variant);
        layerManager.addComposite(this.uuid, variant, sync);
    }

    renameVariant(uuid: string, name: string, sync: boolean): void {
        const v = this._variants.find(v => v.uuid === uuid);
        if (v === undefined) {
            console.error("Variant not found during variant rename");
            return;
        }
        v.name = name;
        if (sync) {
            sendToggleCompositeRenameVariant({ shape: this.uuid, variant: uuid, name });
        }
    }

    removeVariant(uuid: string, sync: boolean): void {
        const v = this._variants.findIndex(v => v.uuid === uuid);
        if (v === undefined) {
            console.error("Variant not found during variant removal");
            return;
        }
        this.setActiveVariant(this._variants[(v + 1) % this._variants.length].uuid, true);
        this._variants.splice(v, 1);
        if (sync) {
            sendToggleCompositeRemoveVariant({ shape: this.uuid, variant: uuid });
        }
    }

    setActiveVariant(variant: string, sync: boolean): void {
        const oldVariant = layerManager.UUIDMap.get(this.active_variant)!;
        oldVariant.options.set("skipDraw", true);
        const oldCenter = oldVariant.center();
        this.active_variant = variant;
        const newVariant = layerManager.UUIDMap.get(this.active_variant)!;
        newVariant.options.delete("skipDraw");
        newVariant.center(oldCenter);

        if (oldVariant.movementObstruction)
            removeBlocker(TriangulationTarget.MOVEMENT, oldVariant.floor.id, oldVariant, true);
        if (oldVariant.visionObstruction)
            removeBlocker(TriangulationTarget.VISION, oldVariant.floor.id, oldVariant, true);
        if (oldVariant.auras.length > 0) removeVisionSources(oldVariant.floor.id, oldVariant.uuid);
        if (newVariant.movementObstruction)
            addBlocker(TriangulationTarget.MOVEMENT, newVariant.uuid, newVariant.floor.id, true);
        if (newVariant.visionObstruction)
            addBlocker(TriangulationTarget.VISION, newVariant.uuid, newVariant.floor.id, true);
        for (const au of newVariant.auras) {
            if (au.visionSource) {
                addVisionSource({ shape: newVariant.uuid, aura: au.uuid }, newVariant.floor.id);
            }
        }

        newVariant.invalidate(false);
        if (sync) {
            sendShapePositionUpdate([newVariant], false);
            sendShapeOptionsUpdate([oldVariant, newVariant], false);
            sendToggleCompositeActiveVariant({ shape: this.uuid, variant });
        }

        const selection = [...newVariant.layer.getSelection({ includeComposites: false })];
        const index = selection.findIndex(s => s.uuid === oldVariant.uuid);
        if (index >= 0) {
            selection.splice(index, 1, newVariant);
            newVariant.layer.setSelection(...selection);
        }
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
        if (centerPoint === undefined) return this.refPoint;
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
