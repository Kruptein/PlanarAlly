import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { Settings } from "@/game/settings";
import { gameStore } from "@/game/store";
import { g2l, g2lr, g2lx, g2ly } from "@/game/units";
import { TriangulationTarget } from "../visibility/te/pa";
import { computeVisibility } from "../visibility/te/te";

export class FOWPlayersLayer extends Layer {
    isVisionLayer = true;

    draw(): void {
        if (!this.valid) {
            // console.time("VI");
            const ctx = this.ctx;

            if (!gameStore.fowLOS || Settings.skipPlayerFOW) {
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.valid = true;
                return;
            }

            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const originalOperation = ctx.globalCompositeOperation;

            ctx.fillStyle = "rgba(0, 0, 0, 1)";

            // For the DM this is done at the end of this function.  TODO: why the split up ???
            // This was done in commit be1e65cff1e7369375fe11cfa1643fab1d11beab.
            if (!gameStore.IS_DM) super.draw(!gameStore.fullFOW);

            for (const tokenId of gameStore.activeTokens) {
                const token = layerManager.UUIDMap.get(tokenId);
                if (token === undefined) continue;
                const center = token.center();
                const lcenter = g2l(center);

                if (true) {
                    // Add a gradient vision dropoff
                    const gradient = ctx.createRadialGradient(
                        lcenter.x,
                        lcenter.y,
                        g2lr(gameStore.visionRangeMin),
                        lcenter.x,
                        lcenter.y,
                        g2lr(gameStore.visionRangeMax),
                    );
                    gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                    ctx.fillStyle = gradient;
                } else {
                    ctx.fillStyle = "rgba(0, 0, 0, 1)";
                }
                try {
                    const polygon = computeVisibility(token.center(), TriangulationTarget.VISION);
                    ctx.beginPath();
                    ctx.moveTo(g2lx(polygon[0][0]), g2ly(polygon[0][1]));
                    for (const point of polygon) ctx.lineTo(g2lx(point[0]), g2ly(point[1]));
                    ctx.closePath();
                    ctx.fill();
                } catch {
                    // no-op
                }
            }

            // For the players this is done at the beginning of this function.  TODO: why the split up ???
            // This was done in commit be1e65cff1e7369375fe11cfa1643fab1d11beab.
            if (gameStore.IS_DM) super.draw(!gameStore.fullFOW);

            ctx.globalCompositeOperation = originalOperation;
            // console.timeEnd("VI");
        }
    }
}
