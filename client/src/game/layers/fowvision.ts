import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { g2l, g2lr, g2lx, g2ly } from "@/game/units";

import { gameSettingsStore } from "../settings";
import { TriangulationTarget } from "../visibility/te/pa";
import { computeVisibility } from "../visibility/te/te";

import { FowLayer } from "./fow";
import { floorStore } from "./store";

export class FowVisionLayer extends FowLayer {
    draw(): void {
        if (!this.valid) {
            const originalOperation = this.ctx.globalCompositeOperation;

            if (!gameSettingsStore.fowLos) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.valid = true;
                return;
            }

            super._draw();

            // For the DM this is done at the end of this function.  TODO: why the split up ???
            // This was done in commit be1e65cff1e7369375fe11cfa1643fab1d11beab.
            if (!gameStore.IS_DM) super.draw(false);

            for (const tokenId of gameStore.activeTokens) {
                const token = layerManager.UUIDMap.get(tokenId);
                if (token === undefined || token.floor.id !== this.floor) continue;
                const center = token.center();
                const lcenter = g2l(center);

                // Add a gradient vision dropoff
                const gradient = this.ctx.createRadialGradient(
                    lcenter.x,
                    lcenter.y,
                    g2lr(gameSettingsStore.visionMinRange),
                    lcenter.x,
                    lcenter.y,
                    g2lr(gameSettingsStore.visionMaxRange),
                );
                gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                this.ctx.fillStyle = gradient;

                try {
                    const polygon = computeVisibility(token.center(), TriangulationTarget.VISION, token.floor.id);
                    this.ctx.beginPath();
                    this.ctx.moveTo(g2lx(polygon[0][0]), g2ly(polygon[0][1]));
                    for (const point of polygon) this.ctx.lineTo(g2lx(point[0]), g2ly(point[1]));
                    this.ctx.closePath();
                    this.ctx.fill();
                } catch {
                    // no-op
                }
            }

            const activeFloor = floorStore.currentFloor.id;
            if (this.floor === activeFloor && floorStore.floors.length > 1) {
                for (let f = floorStore.floors.length - 1; f > floorStore.currentFloorindex; f--) {
                    const floor = floorStore.floors[f];
                    if (floor.id === activeFloor) break;
                    const fowl = layerManager.getLayer(floor, this.name);
                    if (fowl === undefined) continue;
                    this.vCtx.globalCompositeOperation = "destination-over";
                    this.vCtx.drawImage(fowl.canvas, 0, 0);
                    const mapl = layerManager.getLayer(floor, "map");
                    if (mapl === undefined) continue;
                    this.vCtx.globalCompositeOperation = "destination-out";
                    this.vCtx.drawImage(mapl.canvas, 0, 0);
                }
                this.ctx.globalCompositeOperation = "source-over";
                this.ctx.drawImage(this.virtualCanvas, 0, 0);
            }

            // For the players this is done at the beginning of this function.  TODO: why the split up ???
            // This was done in commit be1e65cff1e7369375fe11cfa1643fab1d11beab.
            if (gameStore.IS_DM) super.draw(false);

            this.ctx.globalCompositeOperation = originalOperation;
        }
    }
}
