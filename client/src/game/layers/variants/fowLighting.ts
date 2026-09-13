import { g2l, g2lz, g2lr, toRadians } from "../../../core/conversions";
import type { LocalId } from "../../../core/id";
import type { SyncMode } from "../../../core/models/types";
import { FOG_COLOUR } from "../../colour";
import { getShape } from "../../id";
import type { IShape } from "../../interfaces/shape";
import { LayerName } from "../../models/floor";
import { polygon2path } from "../../rendering/basic";
import { accessState } from "../../systems/access/state";
import { auraSystem } from "../../systems/auras";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { gameState } from "../../systems/game/state";
import { positionState } from "../../systems/position/state";
import { locationSettingsSystem } from "../../systems/settings/location";
import { locationSettingsState } from "../../systems/settings/location/state";
import { AMBIENT_SYMBOL, PORTAL_RANGE, visionState } from "../../vision/state";

import { FowLayer } from "./fow";

export class FowLightingLayer extends FowLayer {
    // We still need removeShapes as this does not inherently call .setLayer, which addShape does
    removeShape(shape: IShape, options: { sync: SyncMode; recalculate: boolean; dropShapeId: boolean }): boolean {
        let idx = -1;
        if (shape.options.preFogShape ?? false) {
            idx = this.preFogShapes.findIndex((s) => s.id === shape.id);
        }
        const remove = super.removeShape(shape, options);
        if (remove) {
            if (idx >= 0) this.preFogShapes.splice(idx, 1);
            if (shape.options.ambientBarrier ?? false) {
                visionState.removeAmbientBarrier(shape.id, this.floor);
            }
        }
        return remove;
    }

    enterLayer(shape: IShape): void {
        if (shape.options.preFogShape ?? false) {
            this.preFogShapes.push(shape);
        }
        if (shape.options.ambientBarrier ?? false) {
            visionState.addAmbientBarrier(shape.id, this.floor);
        }
    }

    exitLayer(shape: IShape): void {
        this.preFogShapes = this.preFogShapes.filter((s) => s.id !== shape.id);
        if (shape.options.ambientBarrier ?? false) {
            visionState.removeAmbientBarrier(shape.id, this.floor);
        }
    }

    private drawAmbientLight(shapeId: LocalId | typeof AMBIENT_SYMBOL): void {
        this.vCtx.globalCompositeOperation = "source-over";
        this.vCtx.fillStyle = "rgba(0, 0, 0, 1)";
        this.vCtx.fillRect(0, 0, this.width, this.height);

        this.vCtx.globalCompositeOperation = "destination-out";
        const interiorMask = visionState.getInteriorPath(this.floor, shapeId);
        if (interiorMask !== undefined) {
            const { panX, panY, zoom } = positionState.readonly;
            this.vCtx.save();
            this.vCtx.transform(zoom, 0, 0, zoom, panX * zoom, panY * zoom);
            this.vCtx.fill(interiorMask);
            this.vCtx.lineWidth = 1 / zoom;
            this.vCtx.strokeStyle = "rgba(0, 0, 0, 1)";
            this.vCtx.stroke(interiorMask);
            this.vCtx.restore();
        }

        this.vCtx.globalCompositeOperation = "source-over";
        const portalMasks = visionState.getPortalMasks(this.floor, shapeId);
        if (portalMasks.length > 0) {
            const { panX, panY, zoom } = positionState.readonly;
            const range = PORTAL_RANGE;
            this.vCtx.save();
            this.vCtx.transform(zoom, 0, 0, zoom, panX * zoom, panY * zoom);
            for (const portal of portalMasks) {
                const gradient = this.vCtx.createRadialGradient(portal.cx, portal.cy, 0, portal.cx, portal.cy, range);
                gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                gradient.addColorStop(0.35, "rgba(0, 0, 0, 1)");
                gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                this.vCtx.fillStyle = gradient;
                this.vCtx.fill(portal.path);
            }
            this.vCtx.restore();
        }

        this.ctx.globalCompositeOperation = "source-over";
        this.ctx.drawImage(this.virtualCanvas, 0, 0, window.innerWidth, window.innerHeight);
    }

    draw(): void {
        if (!this.valid) {
            const originalOperation = this.ctx.globalCompositeOperation;
            super._draw();
            this.isEmpty = true;

            const activeFloor = floorState.currentFloor.value!;
            const isLosActive = locationSettingsSystem.isLosActive();

            // At all times provide a minimal vision range to prevent losing your tokens in fog.
            if (
                locationSettingsState.raw.fullFow.value &&
                floorSystem.hasLayer(activeFloor, LayerName.Tokens) &&
                activeFloor.id === this.floor
            ) {
                for (const sh of accessState.activeTokens.value.get("vision") ?? []) {
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
                        !isLosActive &&
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
                    const aura = auraSystem.get(shape.id, light.aura);
                    if (aura === undefined) continue;

                    // Out of Bounds check
                    if (!isLosActive) {
                        if (!shapesBoundChecked.has(shape.id)) {
                            shapesBoundChecked.add(shape.id);
                            if (shape._visionBbox?.visibleInCanvas({ w: this.width, h: this.height }) ?? false) {
                                this.isEmpty = false;
                            }
                        }
                    }

                    if (aura.floodLight) {
                        this.drawAmbientLight(shape.id);
                        continue;
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

                    // Behind vision mode rendering
                    // Render the additional vision polygon for the light source.
                    // This is calculated in the vision layer,
                    if (visionState.behindVisionLightPaths.has(shape.id)) {
                        for (const points of visionState.behindVisionLightPaths.get(shape.id)!) {
                            this.vCtx.fill(polygon2path(points));
                        }
                    } else if (!isLosActive) {
                        // If we're not using LOS, the light cache is never filled by the vision layer.
                        // We just need to render all of them, as there is no vision shape that constrains this.
                        for (const [, bpPoints] of shape._behindPatches) {
                            for (const { points } of bpPoints) {
                                this.vCtx.fill(polygon2path(points));
                            }
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

            if (
                locationSettingsState.raw.ambientLight.value &&
                locationSettingsState.raw.fullFow.value &&
                this.floor === activeFloor.id
            ) {
                this.drawAmbientLight(AMBIENT_SYMBOL);
            }

            if (isLosActive && this.floor === activeFloor.id) {
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
