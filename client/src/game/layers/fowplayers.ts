import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { g2l, g2lr, g2lx, g2ly } from "@/game/units";
import { gameSettingsStore } from "../settings";
import { TriangulationTarget } from "../visibility/te/pa";
import { computeVisibility } from "../visibility/te/te";

export class FOWPlayersLayer extends Layer {
    isVisionLayer = true;

    virtualCanvas: HTMLCanvasElement;
    vCtx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, name: string, floor: string) {
        super(canvas, name, floor);
        this.virtualCanvas = document.createElement("canvas");
        this.virtualCanvas.width = window.innerWidth;
        this.virtualCanvas.height = window.innerHeight;
        this.vCtx = this.virtualCanvas.getContext("2d")!;
    }

    set width(width: number) {
        super.width = width;
        this.virtualCanvas.width = width;
    }

    set height(height: number) {
        super.height = height;
        this.virtualCanvas.height = height;
    }

    draw(): void {
        if (!this.valid) {
            // console.time("VI");
            const ctx = this.ctx;

            if (!gameSettingsStore.fowLos) {
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.valid = true;
                return;
            }

            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.vCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const originalOperation = ctx.globalCompositeOperation;

            ctx.fillStyle = "rgba(0, 0, 0, 1)";

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

            // For the DM this is done at the end of this function.  TODO: why the split up ???
            // This was done in commit be1e65cff1e7369375fe11cfa1643fab1d11beab.
            if (!gameStore.IS_DM) super.draw(false);

            for (const tokenId of gameStore.activeTokens) {
                const token = layerManager.UUIDMap.get(tokenId);
                if (token === undefined || token.floor !== this.floor) continue;
                const center = token.center();
                const lcenter = g2l(center);

                if (true) {
                    // Add a gradient vision dropoff
                    const gradient = ctx.createRadialGradient(
                        lcenter.x,
                        lcenter.y,
                        g2lr(gameSettingsStore.visionMinRange),
                        lcenter.x,
                        lcenter.y,
                        g2lr(gameSettingsStore.visionMaxRange),
                    );
                    gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                    ctx.fillStyle = gradient;
                } else {
                    ctx.fillStyle = "rgba(0, 0, 0, 1)";
                }
                try {
                    const polygon = computeVisibility(token.center(), TriangulationTarget.VISION, token.floor);
                    ctx.beginPath();
                    ctx.moveTo(g2lx(polygon[0][0]), g2ly(polygon[0][1]));
                    for (const point of polygon) ctx.lineTo(g2lx(point[0]), g2ly(point[1]));
                    ctx.closePath();
                    ctx.fill();
                } catch {
                    // no-op
                }
            }

            if (this.floor === activeFloorName && layerManager.floors.length > 1) {
                for (let f = layerManager.floors.length - 1; f > gameStore.selectedFloorIndex; f--) {
                    const floor = layerManager.floors[f];
                    if (floor.name === activeFloorName) break;
                    const fowl = layerManager.getLayer(floor.name, this.name);
                    if (fowl === undefined) continue;
                    this.vCtx.globalCompositeOperation = "destination-over";
                    this.vCtx.drawImage(fowl.canvas, 0, 0);
                    const mapl = layerManager.getLayer(floor.name, "map");
                    if (mapl === undefined) continue;
                    this.vCtx.globalCompositeOperation = "destination-out";
                    this.vCtx.drawImage(mapl.canvas, 0, 0);
                }
                ctx.globalCompositeOperation = "source-over";
                ctx.drawImage(this.virtualCanvas, 0, 0);
            }

            // For the players this is done at the beginning of this function.  TODO: why the split up ???
            // This was done in commit be1e65cff1e7369375fe11cfa1643fab1d11beab.
            if (gameStore.IS_DM) super.draw(false);

            ctx.globalCompositeOperation = originalOperation;
            // console.timeEnd("VI");
        }
    }
}
