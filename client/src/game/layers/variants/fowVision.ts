import { g2l, g2lr } from "../../../core/conversions";
import { getShape } from "../../id";
import { LayerName } from "../../models/floor";
import { polygon2path } from "../../rendering/basic";
import { accessState } from "../../systems/access/state";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { gameState } from "../../systems/game/state";
import { locationSettingsSystem } from "../../systems/settings/location";
import { locationSettingsState } from "../../systems/settings/location/state";
import { playerSettingsState } from "../../systems/settings/players/state";
import { visionState } from "../../vision/state";

import { FowLayer } from "./fow";

export class FowVisionLayer extends FowLayer {
    draw(): void {
        if (!this.valid) {
            const originalOperation = this.ctx.globalCompositeOperation;

            if (!locationSettingsSystem.isLosActive()) {
                this.ctx.clearRect(0, 0, this.width, this.height);
                this.valid = true;
                return;
            }

            this.isEmpty = true;
            super._draw();

            // For the DM this is done at the end of this function.  TODO: why the split up ???
            // This was done in commit be1e65cff1e7369375fe11cfa1643fab1d11beab.
            if (!gameState.raw.isDm) super.draw(false);

            const visionMin = g2lr(locationSettingsState.raw.visionMinRange.value);
            let visionMax = g2lr(locationSettingsState.raw.visionMaxRange.value);
            // The radial-gradient doesn't handle equal radii properly.
            if (visionMax === visionMin) {
                visionMax += 0.01;
            }

            visionState.behindVisionLightPaths.clear();

            for (const tokenId of accessState.activeTokens.value.get("vision") ?? []) {
                const token = getShape(tokenId);
                if (token === undefined || token.floorId !== this.floor) continue;
                if (token.layerName === LayerName.Dm && gameState.raw.isFakePlayer) continue;

                const center = token.center;
                const lcenter = g2l(center);

                // Add a gradient vision dropoff
                const gradient = this.ctx.createRadialGradient(
                    lcenter.x,
                    lcenter.y,
                    visionMin,
                    lcenter.x,
                    lcenter.y,
                    visionMax,
                );
                gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                this.ctx.fillStyle = gradient;

                this.ctx.fill(token.visionPolygon);

                // Behind vision mode rendering
                // Find all behind-shapes that exist in both the token and the light source's vision polygon.
                for (const lightIds of visionState.getVisionSourcesInView(this.floor)) {
                    const lightShape = getShape(lightIds.shape);
                    if (lightShape === undefined) continue;

                    if (lightShape === token) {
                        // if we're the light source, we don't need to find matching entrances,
                        // we just need to render all of them.
                        const lightPoints = [];
                        for (const [, bpPoints] of token._behindPatches) {
                            for (const { points } of bpPoints) {
                                // Render the additional vision polygon.
                                this.ctx.fill(polygon2path(points));

                                // Store the additional vision polygon for the light source.
                                // so we don't have to do this work twice.
                                lightPoints.push(points);
                            }
                        }
                        visionState.behindVisionLightPaths.set(token.id, lightPoints);
                        break;
                    }

                    for (const [bpId, bpPoints] of token._behindPatches) {
                        const lightBp = lightShape._behindPatches.get(bpId);
                        if (!lightBp) continue;

                        // Matching shapes found,
                        // now check if they actually have overlapping entrances,
                        // for each such entrance, render the additional vision polygon.
                        for (const {
                            entrance: [a, b],
                            points,
                        } of bpPoints) {
                            for (const {
                                entrance: [c, d],
                                points: lightPoints,
                            } of lightBp) {
                                if (a[0] === c[0] && a[1] === c[1] && d[0] === b[0] && d[1] === b[1]) {
                                    // Render the additional vision polygon.
                                    this.ctx.fill(polygon2path(points));

                                    // Store the additional vision polygon for the light source.
                                    // so we don't have to do this work twice.
                                    if (!visionState.behindVisionLightPaths.has(lightShape.id)) {
                                        visionState.behindVisionLightPaths.set(lightShape.id, []);
                                    }
                                    visionState.behindVisionLightPaths.get(lightShape.id)!.push(lightPoints);

                                    break;
                                }
                            }
                        }
                    }
                }

                // Out of Bounds check
                if (token._visionBbox?.visibleInCanvas({ w: this.width, h: this.height }) ?? false) {
                    this.isEmpty = false;
                }
            }

            const activeFloor = floorState.currentFloor.value!.id;
            if (
                playerSettingsState.raw.renderAllFloors.value &&
                this.floor === activeFloor &&
                floorState.raw.floors.length > 1
            ) {
                for (let f = floorState.raw.floors.length - 1; f > floorState.raw.floorIndex; f--) {
                    const floor = floorState.raw.floors[f]!;
                    if (floor.id === activeFloor) break;
                    const fowl = floorSystem.getLayer(floor, this.name);
                    if (fowl === undefined) continue;
                    this.vCtx.globalCompositeOperation = "destination-over";
                    this.vCtx.drawImage(fowl.canvas, 0, 0, window.innerWidth, window.innerHeight);
                    const mapl = floorSystem.getLayer(floor, LayerName.Map);
                    if (mapl === undefined) continue;
                    this.vCtx.globalCompositeOperation = "destination-out";
                    this.vCtx.drawImage(mapl.canvas, 0, 0, window.innerWidth, window.innerHeight);
                }
                this.ctx.globalCompositeOperation = "source-over";
                this.ctx.drawImage(this.virtualCanvas, 0, 0, window.innerWidth, window.innerHeight);
            }

            // For the players this is done at the beginning of this function.  TODO: why the split up ???
            // This was done in commit be1e65cff1e7369375fe11cfa1643fab1d11beab.
            if (gameState.raw.isDm) super.draw(false);

            this.ctx.globalCompositeOperation = originalOperation;
        }
    }
}
