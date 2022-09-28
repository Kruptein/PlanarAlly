import { g2l, g2lr, g2lz, toRadians } from "../../../core/conversions";
import type { InvalidationMode, SyncMode } from "../../../core/models/types";
import { FOG_COLOUR } from "../../colour";
import { getShape } from "../../id";
import type { IShape } from "../../interfaces/shape";
import { accessState } from "../../systems/access/state";
import { auraSystem } from "../../systems/auras";
import { floorState } from "../../systems/floors/state";
import { locationSettingsState } from "../../systems/settings/location/state";
import { visionState } from "../../vision/state";

import { FowLayer } from "./fow";

export class FowLgLightingLayer extends FowLayer {
    addShape(shape: IShape, sync: SyncMode, invalidate: InvalidationMode): void {
        super.addShape(shape, sync, invalidate);
        if (shape.options.preFogShape ?? false) {
            this.preFogShapes.push(shape);
        }
    }

    removeShape(shape: IShape, options: { sync: SyncMode; recalculate: boolean; dropShapeId: boolean }): boolean {
        let idx = -1;
        if (shape.options.preFogShape ?? false) {
            idx = this.preFogShapes.findIndex((s) => s.id === shape.id);
        }
        const remove = super.removeShape(shape, options);
        if (remove && idx >= 0) this.preFogShapes.splice(idx, 1);
        return remove;
    }

    draw(): void {
        if (!this.valid) {
            const originalOperation = this.ctx.globalCompositeOperation;
            super._draw();

            const visionSources = visionState.getVisionSourcesInView(this.floor);

            this.ctx.globalCompositeOperation = "source-over";
            if (locationSettingsState.raw.fullFow.value) {
                for (const light of visionSources) {
                    const shape = getShape(light.shape)!;
                    const aura = auraSystem.get(light.shape, light.aura, true)!;

                    const auraValue = aura.value > 0 && !isNaN(aura.value) ? aura.value : 0;
                    const auraDim = aura.dim > 0 && !isNaN(aura.dim) ? aura.dim : 0;

                    const center = shape.center;
                    const lcenter = g2l(center);
                    const innerRange = g2lr(auraValue + auraDim);

                    this.ctx.beginPath();
                    // if (auraDim > 0) {
                    //     // Fill the light aura with a radial dropoff towards the outside.
                    //     const gradient = this.ctx.createRadialGradient(
                    //         lcenter.x,
                    //         lcenter.y,
                    //         g2lr(auraValue),
                    //         lcenter.x,
                    //         lcenter.y,
                    //         innerRange,
                    //     );
                    //     gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                    //     gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                    //     this.ctx.fillStyle = gradient;
                    // } else {
                    this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
                    // }

                    const angleA = shape.angle + toRadians(aura.direction - aura.angle / 2);
                    const angleB = shape.angle + toRadians(aura.direction + aura.angle / 2);

                    if (aura.angle < 360) {
                        this.ctx.moveTo(lcenter.x, lcenter.y);
                        this.ctx.lineTo(
                            lcenter.x + innerRange * Math.cos(angleA),
                            lcenter.y + innerRange * Math.sin(angleA),
                        );
                    }
                    this.ctx.arc(lcenter.x, lcenter.y, innerRange, angleA, angleB);
                    if (aura.angle < 360) {
                        this.ctx.lineTo(lcenter.x, lcenter.y);
                    }
                    // we cannot fill outside of the for loop due to the gradients :(
                    this.ctx.fill();
                }
            }

            // second pass to filter to light source vision

            this.ctx.globalCompositeOperation = "destination-in";
            this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
            let path = new Path2D();
            // this.vCtx.beginPath();
            for (const light of visionSources) {
                const shape = getShape(light.shape)!;
                path.addPath(shape.visionPolygon);
            }
            this.ctx.fill(path);

            // don't combine these two fills, we need the two separate destination-in draws

            path = new Path2D();
            let a = false;
            for (const tokenId of accessState.activeTokens.value) {
                const token = getShape(tokenId);
                if (token === undefined || token.floor.id !== this.floor) continue;
                a = true;

                const polygon = token.visionPolygon;
                path.addPath(polygon);
            }
            if (!a) {
                path.rect(0, 0, 1, 1);
            }
            this.ctx.fill(path);

            this.ctx.globalCompositeOperation = "source-over";

            // At all times provide a minimal vision range to prevent losing your tokens in fog.
            const currentFloorId = floorState.currentFloor.value!.id;
            if (locationSettingsState.raw.fullFow.value && currentFloorId === this.floor) {
                path = new Path2D();
                this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
                for (const sh of accessState.activeTokens.value) {
                    const shape = getShape(sh);
                    if (shape === undefined) continue;
                    if (shape.options.skipDraw ?? false) continue;
                    if (shape.floor.id !== currentFloorId) continue;
                    const bb = shape.getBoundingBox();
                    const lcenter = g2l(shape.center);
                    const alm = 0.8 * g2lz(bb.w);
                    const p = new Path2D();
                    p.arc(lcenter.x, lcenter.y, alm, 0, 2 * Math.PI);
                    path.addPath(p);
                    // const gradient = this.ctx.createRadialGradient(
                    //     lcenter.x,
                    //     lcenter.y,
                    //     alm / 2,
                    //     lcenter.x,
                    //     lcenter.y,
                    //     alm,
                    // );
                    // gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                    // gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                    // this.ctx.fillStyle = gradient;
                    // this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
                    // this.ctx.fill();
                }
                this.ctx.fill(path);
            }

            const activeFloor = floorState.currentFloor.value!.id;

            for (const preShape of this.preFogShapes) {
                if (!preShape.visibleInCanvas({ w: this.width, h: this.height }, { includeAuras: true })) continue;
                const ogComposite = preShape.globalCompositeOperation;
                if (!locationSettingsState.raw.fullFow.value) {
                    if (preShape.globalCompositeOperation === "source-over")
                        preShape.globalCompositeOperation = "destination-out";
                    else if (preShape.globalCompositeOperation === "destination-out")
                        preShape.globalCompositeOperation = "source-over";
                }
                preShape.draw(this.ctx);
                preShape.globalCompositeOperation = ogComposite;
            }

            if (locationSettingsState.raw.fullFow.value && this.floor === activeFloor) {
                this.ctx.globalCompositeOperation = "source-out";
                this.ctx.fillStyle = FOG_COLOUR;
                this.ctx.fillRect(0, 0, this.width, this.height);
            }

            super.draw(false);

            this.ctx.globalCompositeOperation = originalOperation;
        }
    }
}
