import { g2l, g2lz, getUnitDistance, g2lr, g2lx, g2ly, toRadians } from "../../../core/conversions";
import { SyncMode, InvalidationMode } from "../../../core/models/types";
import { floorStore } from "../../../store/floor";
import { gameStore } from "../../../store/game";
import { settingsStore } from "../../../store/settings";
import { UuidMap } from "../../../store/shapeMap";
import { getFogColour } from "../../colour";
import { LayerName } from "../../models/floor";
import { Shape } from "../../shapes/shape";
import { Circle } from "../../shapes/variants/circle";
import { TriangulationTarget, visionState } from "../../vision/state";
import { computeVisibility } from "../../vision/te";

import { FowLayer } from "./fow";

export class FowLightingLayer extends FowLayer {
    addShape(shape: Shape, sync: SyncMode, invalidate: InvalidationMode, snappable = true): void {
        super.addShape(shape, sync, invalidate, snappable);
        if (shape.options.preFogShape ?? false) {
            this.preFogShapes.push(shape);
        }
    }

    removeShape(shape: Shape, sync: SyncMode, recalculate: boolean): boolean {
        let idx = -1;
        if (shape.options.preFogShape ?? false) {
            idx = this.preFogShapes.findIndex((s) => s.uuid === shape.uuid);
        }
        const remove = super.removeShape(shape, sync, recalculate);
        if (remove && idx >= 0) this.preFogShapes.splice(idx, 1);
        return remove;
    }

    draw(): void {
        if (!this.valid) {
            const originalOperation = this.ctx.globalCompositeOperation;
            super._draw();

            // At all times provide a minimal vision range to prevent losing your tokens in fog.
            if (
                settingsStore.fullFow.value &&
                floorStore.hasLayer(floorStore.currentFloor.value!, LayerName.Tokens) &&
                floorStore.currentFloor.value!.id === this.floor
            ) {
                for (const sh of gameStore.activeTokens.value) {
                    const shape = UuidMap.get(sh)!;
                    if (shape.options.skipDraw ?? false) continue;
                    if (shape.floor.id !== floorStore.currentFloor.value!.id) continue;
                    const bb = shape.getBoundingBox();
                    const lcenter = g2l(shape.center());
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
                }
            }

            // First cut out all the light sources
            for (const light of visionState.getVisionSources(this.floor)) {
                const shape = UuidMap.get(light.shape);
                if (shape === undefined) continue;
                const aura = shape.getAuras(true).find((a) => a.uuid === light.aura);
                if (aura === undefined) continue;

                if (!shape.ownedBy(true, { visionAccess: true }) && !aura.visible) continue;

                const auraValue = aura.value > 0 && !isNaN(aura.value) ? aura.value : 0;
                const auraDim = aura.dim > 0 && !isNaN(aura.dim) ? aura.dim : 0;

                const auraLength = getUnitDistance(auraValue + auraDim);
                const center = shape.center();
                const lcenter = g2l(center);
                const innerRange = g2lr(auraValue + auraDim);

                const auraCircle = new Circle(center, auraLength);
                if (!auraCircle.visibleInCanvas(this.ctx.canvas, { includeAuras: true })) continue;

                this.vCtx.globalCompositeOperation = "source-over";
                this.vCtx.fillStyle = "rgba(0, 0, 0, 1)";
                const polygon = computeVisibility(center, TriangulationTarget.VISION, shape.floor.id);
                this.vCtx.beginPath();
                this.vCtx.moveTo(g2lx(polygon[0][0]), g2ly(polygon[0][1]));
                for (const point of polygon) this.vCtx.lineTo(g2lx(point[0]), g2ly(point[1]));
                this.vCtx.closePath();
                this.vCtx.fill();
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
                } else {
                    this.vCtx.fillStyle = "rgba(0, 0, 0, 1)";
                }
                this.vCtx.globalCompositeOperation = "source-in";
                this.vCtx.beginPath();

                const angleA = toRadians(aura.direction - aura.angle / 2);
                const angleB = toRadians(aura.direction + aura.angle / 2);

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

            const activeFloor = floorStore.currentFloor.value!.id;
            if (settingsStore.fowLos.value && this.floor === activeFloor) {
                this.ctx.globalCompositeOperation = "source-in";
                this.ctx.drawImage(
                    floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Vision)!.canvas,
                    0,
                    0,
                    window.innerWidth,
                    window.innerHeight,
                );
            }

            for (const preShape of this.preFogShapes) {
                if (!preShape.visibleInCanvas(this.canvas, { includeAuras: true })) continue;
                const ogComposite = preShape.globalCompositeOperation;
                if (!settingsStore.fullFow.value) {
                    if (preShape.globalCompositeOperation === "source-over")
                        preShape.globalCompositeOperation = "destination-out";
                    else if (preShape.globalCompositeOperation === "destination-out")
                        preShape.globalCompositeOperation = "source-over";
                }
                preShape.draw(this.ctx);
                preShape.globalCompositeOperation = ogComposite;
            }

            if (settingsStore.fullFow.value && this.floor === activeFloor) {
                this.ctx.globalCompositeOperation = "source-out";
                this.ctx.fillStyle = getFogColour();
                this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            }

            super.draw(false);

            this.ctx.globalCompositeOperation = originalOperation;
        }
    }
}
