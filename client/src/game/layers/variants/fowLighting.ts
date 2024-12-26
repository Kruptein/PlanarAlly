import { g2l, g2lz, g2lr, toRadians } from "../../../core/conversions";
import type { LocalId } from "../../../core/id";
import type { SyncMode, InvalidationMode } from "../../../core/models/types";
import { FOG_COLOUR } from "../../colour";
import { getShape } from "../../id";
import type { IShape } from "../../interfaces/shape";
import { LayerName } from "../../models/floor";
import { accessState } from "../../systems/access/state";
import { auraSystem } from "../../systems/auras";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { gameState } from "../../systems/game/state";
import { locationSettingsState } from "../../systems/settings/location/state";
import { visionState } from "../../vision/state";

import { FowLayer } from "./fow";

export class FowLightingLayer extends FowLayer {
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
            this.isEmpty = true;

            const activeFloor = floorState.currentFloor.value!;

            // At all times provide a minimal vision range to prevent losing your tokens in fog.
            if (
                locationSettingsState.raw.fullFow.value &&
                floorSystem.hasLayer(activeFloor, LayerName.Tokens) &&
                activeFloor.id === this.floor
            ) {
                for (const sh of accessState.activeTokens.value) {
                    const shape = getShape(sh);
                    if (shape === undefined) continue;
                    if (shape.options.skipDraw ?? false) continue;
                    if (shape.floorId !== activeFloor.id) continue;
                    if (shape.layerName === LayerName.Dm && gameState.raw.isFakePlayer) continue;
                    const bb = shape.getBoundingBox();
                    const lcenter = g2l(shape.center);
                    const alm = 0.8 * g2lz(bb.w);
                    this.ctx.beginPath();
                    this.ctx.arc(lcenter.x, lcenter.y, alm, 0, 2 * Math.PI);

                    const gradient = this.ctx.createRadialGradient(
                        lcenter.x,
                        lcenter.y,
                        alm / 2,
                        lcenter.x,
                        lcenter.y,
                        alm,
                    );
                    gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                    this.ctx.fillStyle = gradient;

                    this.ctx.fill();

                    // Out of Bounds check
                    if (
                        // It's overkill to check this if fowLos is set
                        !locationSettingsState.raw.fowLos.value &&
                        bb.visibleInCanvas({ w: this.width, h: this.height })
                    ) {
                        this.isEmpty = false;
                    }
                }
            }

            // First cut out all the light sources
            if (locationSettingsState.raw.fullFow.value) {
                const shapesBoundChecked = new Set<LocalId>();
                for (const light of visionState.getVisionSourcesInView(this.floor)) {
                    const shape = getShape(light.shape);
                    if (shape === undefined) continue;
                    const aura = auraSystem.get(shape.id, light.aura, true);
                    if (aura === undefined) continue;

                    // Out of Bounds check
                    if (!locationSettingsState.raw.fowLos.value) {
                        if (!shapesBoundChecked.has(shape.id)) {
                            shapesBoundChecked.add(shape.id);
                            if (shape._visionBbox?.visibleInCanvas({ w: this.width, h: this.height }) ?? false) {
                                this.isEmpty = false;
                            }
                        }
                    }

                    const auraValue = aura.value > 0 && !isNaN(aura.value) ? aura.value : 0;
                    const auraDim = aura.dim > 0 && !isNaN(aura.dim) ? aura.dim : 0;

                    if (auraValue + auraDim === 0) continue;

                    const center = shape.center;
                    const lcenter = g2l(center);
                    const innerRange = g2lr(auraValue + auraDim);

                    this.vCtx.globalCompositeOperation = "source-over";
                    this.vCtx.fillStyle = "rgba(0, 0, 0, 1)";
                    this.vCtx.fill(shape.visionPolygon);
                    for (const sh of shape._lightBlockingNeighbours) {
                        const hitShape = getShape(sh);
                        if (hitShape) {
                            hitShape.draw(this.vCtx, true);
                        }
                    }
                    if (auraDim > 0) {
                        // Fill the light aura with a radial dropoff towards the outside.
                        const gradient = this.vCtx.createRadialGradient(
                            lcenter.x,
                            lcenter.y,
                            g2lr(auraValue),
                            lcenter.x,
                            lcenter.y,
                            innerRange,
                        );
                        gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                        this.vCtx.fillStyle = gradient;
                    }
                    this.vCtx.globalCompositeOperation = "source-in";
                    this.vCtx.beginPath();

                    const angleA = shape.angle + toRadians(aura.direction - aura.angle / 2);
                    const angleB = shape.angle + toRadians(aura.direction + aura.angle / 2);

                    if (aura.angle < 360) {
                        this.vCtx.moveTo(lcenter.x, lcenter.y);
                        this.vCtx.lineTo(
                            lcenter.x + innerRange * Math.cos(angleA),
                            lcenter.y + innerRange * Math.sin(angleA),
                        );
                    }
                    this.vCtx.arc(lcenter.x, lcenter.y, innerRange, angleA, angleB);
                    if (aura.angle < 360) {
                        this.vCtx.lineTo(lcenter.x, lcenter.y);
                    }

                    this.vCtx.fill();
                    this.ctx.drawImage(this.virtualCanvas, 0, 0, window.innerWidth, window.innerHeight);
                }
            }

            if (locationSettingsState.raw.fowLos.value && this.floor === activeFloor.id) {
                this.ctx.globalCompositeOperation = "source-in";
                this.ctx.drawImage(
                    floorSystem.getLayer(activeFloor, LayerName.Vision)!.canvas,
                    0,
                    0,
                    window.innerWidth,
                    window.innerHeight,
                );
            }

            for (const preShape of this.preFogShapes) {
                if (!preShape.visibleInCanvas({ w: this.width, h: this.height }, { includeAuras: true })) continue;
                const ogComposite = preShape.globalCompositeOperation;
                if (!locationSettingsState.raw.fullFow.value) {
                    if (preShape.globalCompositeOperation === "source-over")
                        preShape.globalCompositeOperation = "destination-out";
                    else if (preShape.globalCompositeOperation === "destination-out")
                        preShape.globalCompositeOperation = "source-over";
                }
                preShape.draw(this.ctx, false);
                preShape.globalCompositeOperation = ogComposite;
                this.isEmpty = false;
            }

            if (locationSettingsState.raw.fullFow.value && this.floor === activeFloor.id) {
                this.ctx.globalCompositeOperation = "source-out";
                this.ctx.fillStyle = FOG_COLOUR;
                this.ctx.fillRect(0, 0, this.width, this.height);
            }

            super.draw(false);

            this.ctx.globalCompositeOperation = originalOperation;
        }
    }
}
