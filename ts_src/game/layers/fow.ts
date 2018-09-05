import gameManager from "../manager";
import Settings from "../settings";
import Circle from "../shapes/circle";
import Shape from "../shapes/shape";
import store from "../store";

import { GlobalPoint, Ray } from "../geom";
import { g2l, g2lr, g2lx, g2ly, g2lz, getUnitDistance } from "../units";
import { getFogColour } from "../utils";
import { Layer } from "./layer";

export class FOWLayer extends Layer {
    isVisionLayer: boolean = true;
    preFogShapes: Shape[] = [];

    addShape(shape: Shape, sync: boolean, temporary?: boolean): void {
        super.addShape(shape, sync, temporary);
        if (shape.options.has("preFogShape") && shape.options.get("preFogShape")) {
            this.preFogShapes.push(shape);
        }
    }

    removeShape(shape: Shape, sync: boolean, temporary?: boolean) {
        if (shape.options.has("preFogShape") && shape.options.get("preFogShape")) {
            const idx = this.preFogShapes.findIndex(s => s.uuid === shape.uuid);
            this.preFogShapes.splice(idx, 1);
        }
        super.removeShape(shape, sync, temporary);
    }

    draw(): void {
        if (!this.valid) {
            const ctx = this.ctx;

            if (Settings.skipLightFOW) {
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.valid = true;
                return;
            }

            const originalOperation = ctx.globalCompositeOperation;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.fillStyle = "rgba(0, 0, 0, 1)";

            const dctx = gameManager.layerManager.getLayer("draw")!.ctx;
            if (Settings.drawAngleLines || Settings.drawFirstLightHit) {
                dctx.clearRect(0, 0, dctx.canvas.width, dctx.canvas.height);
            }

            // At all times provide a minimal vision range to prevent losing your tokens in fog.
            if (gameManager.layerManager.hasLayer("tokens")) {
                gameManager.layerManager.getLayer("tokens")!.shapes.forEach(sh => {
                    if (!sh.ownedBy() || !sh.isToken) return;
                    const bb = sh.getBoundingBox();
                    const lcenter = g2l(sh.center());
                    const alm = 0.8 * g2lz(bb.w);
                    ctx.beginPath();
                    ctx.arc(lcenter.x, lcenter.y, alm, 0, 2 * Math.PI);
                    const gradient = ctx.createRadialGradient(lcenter.x, lcenter.y, alm / 2, lcenter.x, lcenter.y, alm);
                    gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                    ctx.fillStyle = gradient;
                    ctx.fill();
                });
            }

            // First cut out all the light sources
            for (const light of gameManager.lightsources) {
                const shape = gameManager.layerManager.UUIDMap.get(light.shape);
                if (shape === undefined) continue;
                const aura = shape.auras.find(a => a.uuid === light.aura);
                if (aura === undefined) continue;

                const auraLength = getUnitDistance(aura.value + aura.dim);
                const center = shape.center();
                const lcenter = g2l(center);

                const auraCircle = new Circle(center, auraLength);
                if (!auraCircle.visibleInCanvas(ctx.canvas)) continue;

                let lastArcAngle = -1;

                const path = new Path2D();
                path.moveTo(lcenter.x, lcenter.y);
                let firstPoint: GlobalPoint;

                for (let angle = 0; angle < 2 * Math.PI; angle += (Settings.angleSteps / 180) * Math.PI) {
                    const anglePoint = new GlobalPoint(
                        center.x + auraLength * Math.cos(angle),
                        center.y + auraLength * Math.sin(angle),
                    );
                    if (Settings.drawAngleLines) {
                        dctx!.beginPath();
                        dctx!.moveTo(g2lx(center.x), g2ly(center.y));
                        dctx!.lineTo(g2lx(anglePoint.x), g2ly(anglePoint.y));
                        dctx!.stroke();
                    }

                    // Check if there is a hit with one of the nearby light blockers.
                    const lightRay = Ray.fromPoints(center, anglePoint);
                    const hitResult = gameManager.BV.intersect(lightRay);

                    if (angle === 0) firstPoint = hitResult.hit ? hitResult.intersect : anglePoint;

                    // We can move on to the next angle if nothing was hit.
                    if (!hitResult.hit) {
                        // If an earlier hit caused the aura to leave the arc, we need to go back to the arc
                        if (lastArcAngle === -1) {
                            // Set the start of a new arc beginning at the current angle
                            lastArcAngle = angle;
                            // Draw a line from the last non arc location back to the arc
                            const dest = g2l(anglePoint);
                            ctx.lineTo(dest.x, dest.y);
                        }
                        continue;
                    }
                    // If hit , first finish any ongoing arc, then move to the intersection point
                    if (lastArcAngle !== -1) {
                        path.arc(lcenter.x, lcenter.y, g2lr(aura.value + aura.dim), lastArcAngle, angle);
                        lastArcAngle = -1;
                    }
                    path.lineTo(g2lx(hitResult.intersect.x), g2ly(hitResult.intersect.y));
                }

                // Finish the final arc.
                if (lastArcAngle === -1) path.lineTo(g2lx(firstPoint!.x), g2ly(firstPoint!.y));
                else path.arc(lcenter.x, lcenter.y, g2lr(aura.value + aura.dim), lastArcAngle, 2 * Math.PI);

                // Fill the light aura with a radial dropoff towards the outside.
                const gradient = ctx.createRadialGradient(
                    lcenter.x,
                    lcenter.y,
                    g2lr(aura.value),
                    lcenter.x,
                    lcenter.y,
                    g2lr(aura.value + aura.dim),
                );
                gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = gradient;
                ctx.fill(path);

                aura.lastPath = path;
            }

            // for (let p=0; p < this.preFogShapes.length; p++) {
            //     const pS = this.preFogShapes[p];
            //     if (!pS.visibleInCanvas(this.canvas)) return;
            //     pS.draw(ctx);
            // }

            // At the DM Side due to opacity of the two fow layers, it looks strange if we just render them on top of eachother like players.
            if (store.state.fowLOS) {
                ctx.globalCompositeOperation = "source-in";
                ctx.drawImage(gameManager.layerManager.getLayer("fow-players")!.canvas, 0, 0);
            }

            for (const preShape of this.preFogShapes) {
                if (!preShape.visibleInCanvas(this.canvas)) continue;
                preShape.draw(ctx);
            }

            ctx.globalCompositeOperation = "source-out";
            ctx.fillStyle = getFogColour();
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            super.draw(!store.state.fullFOW);

            ctx.globalCompositeOperation = originalOperation;
        }
    }
}
