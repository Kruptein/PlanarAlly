import { GlobalPoint, Ray } from "@/game/geom";
import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { Settings } from "@/game/settings";
import { Circle } from "@/game/shapes/circle";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";
import { g2l, g2lr, g2lx, g2ly, g2lz, getUnitDistance } from "@/game/units";
import { getFogColour } from "@/game/utils";
import { visibilityStore } from "../visibility/store";
import { computeVisibility } from "../visibility/te/te";
import { TriangulationTarget } from "../visibility/te/pa";
import { circleLineIntersection, xyEqual } from "../visibility/te/triag";

export class FOWLayer extends Layer {
    isVisionLayer: boolean = true;
    preFogShapes: Shape[] = [];
    virtualCanvas: HTMLCanvasElement;
    vCtx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, name: string) {
        super(canvas, name);
        this.virtualCanvas = document.createElement("canvas");
        this.virtualCanvas.width = window.innerWidth;
        this.virtualCanvas.height = window.innerHeight;
        this.vCtx = this.virtualCanvas.getContext("2d")!;
    }

    addShape(shape: Shape, sync: boolean, temporary?: boolean, invalidate = true): void {
        super.addShape(shape, sync, temporary, invalidate);
        if (shape.options.has("preFogShape") && shape.options.get("preFogShape")) {
            this.preFogShapes.push(shape);
        }
    }

    removeShape(shape: Shape, sync: boolean, temporary?: boolean): void {
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

            const dctx = layerManager.getLayer("draw")!.ctx;
            if (Settings.drawAngleLines || Settings.drawFirstLightHit) {
                dctx.clearRect(0, 0, dctx.canvas.width, dctx.canvas.height);
            }

            // At all times provide a minimal vision range to prevent losing your tokens in fog.
            if (gameStore.fullFOW && layerManager.hasLayer("tokens")) {
                for (const sh of layerManager.getLayer("tokens")!.shapes) {
                    if (!sh.ownedBy() || !sh.isToken) continue;
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
                }
            }

            this.vCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            // First cut out all the light sources
            for (const light of visibilityStore.visionSources) {
                const shape = layerManager.UUIDMap.get(light.shape);
                if (shape === undefined) continue;
                const aura = shape.auras.find(a => a.uuid === light.aura);
                if (aura === undefined) continue;

                const auraLength = getUnitDistance(aura.value + aura.dim);
                const center = shape.center();
                const lcenter = g2l(center);

                const auraCircle = new Circle(center, auraLength);
                if (!auraCircle.visibleInCanvas(ctx.canvas)) continue;

                if (visibilityStore.visionMode === "bvh") {
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
                        const hitResult = visibilityStore.BV.intersect(lightRay);

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

                    if (gameStore.fullFOW) {
                        if (aura.dim > 0) {
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
                        } else {
                            ctx.fillStyle = "rgba(0, 0, 0, 1)";
                        }
                        ctx.fill(path);
                    }

                    aura.lastPath = path;
                } else {
                    this.vCtx.globalCompositeOperation = "source-over";
                    this.vCtx.fillStyle = "rgba(0, 0, 0, 1)";
                    const polygon = computeVisibility(center, TriangulationTarget.VISION);
                    this.vCtx.beginPath();
                    this.vCtx.moveTo(g2lx(polygon[0][0]), g2ly(polygon[0][1]));
                    for (const point of polygon) this.vCtx.lineTo(g2lx(point[0]), g2ly(point[1]));
                    this.vCtx.closePath();
                    this.vCtx.fill();
                    if (aura.dim > 0) {
                        // Fill the light aura with a radial dropoff towards the outside.
                        const gradient = this.vCtx.createRadialGradient(
                            lcenter.x,
                            lcenter.y,
                            g2lr(aura.value),
                            lcenter.x,
                            lcenter.y,
                            g2lr(aura.value + aura.dim),
                        );
                        gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                        this.vCtx.fillStyle = gradient;
                    } else {
                        this.vCtx.fillStyle = "rgba(0, 0, 0, 1)";
                    }
                    this.vCtx.globalCompositeOperation = "source-in";
                    this.vCtx.beginPath();
                    this.vCtx.arc(lcenter.x, lcenter.y, g2lr(aura.value + aura.dim), 0, 2 * Math.PI);
                    this.vCtx.fill();
                    ctx.drawImage(this.virtualCanvas, 0, 0);
                    aura.lastPath = this.updateAuraPath(polygon, auraCircle);
                }
            }

            // At the DM Side due to opacity of the two fow layers, it looks strange if we just render them on top of eachother like players.
            if (gameStore.fowLOS) {
                ctx.globalCompositeOperation = "source-in";
                ctx.drawImage(layerManager.getLayer("fow-players")!.canvas, 0, 0);
            }

            for (const preShape of this.preFogShapes) {
                if (!preShape.visibleInCanvas(this.canvas)) continue;
                const ogComposite = preShape.globalCompositeOperation;
                if (!gameStore.fullFOW) {
                    if (preShape.globalCompositeOperation === "source-over")
                        preShape.globalCompositeOperation = "destination-out";
                    else if (preShape.globalCompositeOperation === "destination-out")
                        preShape.globalCompositeOperation = "source-over";
                }
                preShape.draw(ctx);
                preShape.globalCompositeOperation = ogComposite;
            }

            if (gameStore.fullFOW) {
                ctx.globalCompositeOperation = "source-out";
                ctx.fillStyle = getFogColour();
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }

            super.draw(false);

            ctx.globalCompositeOperation = originalOperation;
        }
    }

    updateAuraPath(visibilityPolygon: number[][], auraCircle: Circle): Path2D {
        const path = new Path2D();
        const lCenter = g2l(auraCircle.center());
        const lRadius = g2lz(auraCircle.r);
        let firstAngle: number | null = null;
        let lastAngle: number | null = null;

        for (const [i, p] of visibilityPolygon.map(p => GlobalPoint.fromArray(p)).entries()) {
            const np = GlobalPoint.fromArray(visibilityPolygon[(i + 1) % visibilityPolygon.length]);
            const pLoc = g2l(p);
            const npLoc = g2l(np);
            const ix = circleLineIntersection(auraCircle.center(), auraCircle.r, p, np).map(x => g2l(x));
            if (ix.length === 0) {
                // segment lies completely outside circle
                if (!auraCircle.contains(p)) continue;
                // Segment lies completely inside circle
                else ix.push(pLoc, npLoc);
            } else if (ix.length === 1) {
                // segment is tangent to circle, segment can be ignored
                if (xyEqual(ix[0].asArray(), pLoc.asArray()) || xyEqual(ix[0].asArray(), npLoc.asArray())) continue;
                if (auraCircle.contains(p)) {
                    ix.unshift(pLoc);
                } else {
                    ix.push(npLoc);
                }
            }
            // actual work
            const circleHitAngle = Math.atan2(ix[0].y - lCenter.y, ix[0].x - lCenter.x);
            if (lastAngle === null) {
                path.moveTo(ix[0].x, ix[0].y);
                firstAngle = Math.atan2(ix[0].y - lCenter.y, ix[0].x - lCenter.x);
            } else if (lastAngle !== circleHitAngle) {
                path.arc(lCenter.x, lCenter.y, lRadius, lastAngle, circleHitAngle);
            }
            lastAngle = Math.atan2(ix[1].y - lCenter.y, ix[1].x - lCenter.x);
            path.lineTo(ix[1].x, ix[1].y);
        }
        if (firstAngle && lastAngle) path.arc(lCenter.x, lCenter.y, lRadius, lastAngle, firstAngle);
        else path.arc(lCenter.x, lCenter.y, lRadius, 0, 2 * Math.PI);

        return path;
    }
}
