import { InvalidationMode, SyncMode } from "@/core/comm/types";
import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { Settings } from "@/game/settings";
import { Circle } from "@/game/shapes/circle";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";
import { g2l, g2lr, g2lx, g2ly, g2lz, getUnitDistance } from "@/game/units";
import { getFogColour } from "@/game/utils";
import { getVisionSources } from "@/game/visibility/utils";
import { TriangulationTarget } from "../visibility/te/pa";
import { computeVisibility } from "../visibility/te/te";

export class FOWLayer extends Layer {
    isVisionLayer = true;
    preFogShapes: Shape[] = [];
    virtualCanvas: HTMLCanvasElement;
    vCtx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, name: string, floor: string) {
        super(canvas, name, floor);
        this.virtualCanvas = document.createElement("canvas");
        this.virtualCanvas.width = window.innerWidth;
        this.virtualCanvas.height = window.innerHeight;
        this.vCtx = this.virtualCanvas.getContext("2d")!;
    }

    addShape(shape: Shape, sync: SyncMode, invalidate: InvalidationMode, snappable = true): void {
        super.addShape(shape, sync, invalidate, snappable);
        if (shape.options.has("preFogShape") && shape.options.get("preFogShape")) {
            this.preFogShapes.push(shape);
        }
    }

    removeShape(shape: Shape, sync: SyncMode): void {
        if (shape.options.has("preFogShape") && shape.options.get("preFogShape")) {
            const idx = this.preFogShapes.findIndex(s => s.uuid === shape.uuid);
            this.preFogShapes.splice(idx, 1);
        }
        super.removeShape(shape, sync);
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

            const dctx = layerManager.getLayer(this.floor, "draw")!.ctx;
            if (Settings.drawAngleLines || Settings.drawFirstLightHit) {
                dctx.clearRect(0, 0, dctx.canvas.width, dctx.canvas.height);
            }

            const activeFloorName = gameStore.floors[gameStore.selectedFloorIndex];

            if (this.floor === activeFloorName && this.canvas.style.display === "none")
                this.canvas.style.removeProperty("display");
            else if (this.floor !== activeFloorName && this.canvas.style.display !== "none")
                this.canvas.style.display = "none";

            if (this.floor === activeFloorName && layerManager.floors.length > 1) {
                for (const floor of layerManager.floors) {
                    if (floor.name !== gameStore.floors[0]) {
                        const mapl = layerManager.getLayer(floor.name, "map");
                        if (mapl === undefined) continue;
                        ctx.globalCompositeOperation = "destination-out";
                        ctx.drawImage(mapl.canvas, 0, 0);
                    }
                    if (floor.name !== activeFloorName) {
                        const fowl = layerManager.getLayer(floor.name, this.name);
                        if (fowl === undefined) continue;
                        ctx.globalCompositeOperation = "source-over";
                        ctx.drawImage(fowl.canvas, 0, 0);
                    }
                    if (floor.name === activeFloorName) break;
                }
            }
            ctx.globalCompositeOperation = "source-over";

            // At all times provide a minimal vision range to prevent losing your tokens in fog.
            if (
                gameStore.fullFOW &&
                layerManager.hasLayer(this.floor, "tokens") &&
                this.floor === gameStore.floors[gameStore.selectedFloorIndex]
            ) {
                for (const sh of layerManager.getLayer(this.floor, "tokens")!.shapes) {
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
            for (const light of getVisionSources(this.floor)) {
                const shape = layerManager.UUIDMap.get(light.shape);
                if (shape === undefined) continue;
                const aura = shape.auras.find(a => a.uuid === light.aura);
                if (aura === undefined) continue;

                const auraLength = getUnitDistance(aura.value + aura.dim);
                const center = shape.center();
                const lcenter = g2l(center);

                const auraCircle = new Circle(center, auraLength);
                if (!auraCircle.visibleInCanvas(ctx.canvas)) continue;

                this.vCtx.globalCompositeOperation = "source-over";
                this.vCtx.fillStyle = "rgba(0, 0, 0, 1)";
                const polygon = computeVisibility(center, TriangulationTarget.VISION, shape.floor);
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
                // aura.lastPath = this.updateAuraPath(polygon, auraCircle);
                // shape.invalidate(true);
            }

            if (gameStore.fowLOS && this.floor === activeFloorName) {
                ctx.globalCompositeOperation = "source-in";
                ctx.drawImage(layerManager.getLayer(this.floor, "fow-players")!.canvas, 0, 0);
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

            if (gameStore.fullFOW && this.floor === activeFloorName) {
                ctx.globalCompositeOperation = "source-out";
                ctx.fillStyle = getFogColour();
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }

            super.draw(false);

            ctx.globalCompositeOperation = originalOperation;
        }
    }
}
