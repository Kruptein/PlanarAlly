import { g2l, g2lr, g2lx, g2ly } from "../../../core/conversions";
import { floorStore } from "../../../store/floor";
import { gameStore } from "../../../store/game";
import { settingsStore } from "../../../store/settings";
import { getShape } from "../../id";
import { LayerName } from "../../models/floor";
import { TriangulationTarget } from "../../vision/state";
import { computeVisibility } from "../../vision/te";

import { FowLayer } from "./fow";

export class FowVisionLayer extends FowLayer {
    draw(): void {
        if (!this.valid) {
            const originalOperation = this.ctx.globalCompositeOperation;

            if (!settingsStore.fowLos.value) {
                this.ctx.clearRect(0, 0, this.width, this.height);
                this.valid = true;
                return;
            }

            super._draw();

            // For the DM this is done at the end of this function.  TODO: why the split up ???
            // This was done in commit be1e65cff1e7369375fe11cfa1643fab1d11beab.
            if (!gameStore.state.isDm) super.draw(false);

            const visionMin = g2lr(settingsStore.visionMinRange.value);
            let visionMax = g2lr(settingsStore.visionMaxRange.value);
            // The radial-gradient doesn't handle equal radii properly.
            if (visionMax === visionMin) {
                visionMax += 0.01;
            }

            for (const tokenId of gameStore.activeTokens.value) {
                const token = getShape(tokenId);
                if (token === undefined || token.floor.id !== this.floor) continue;
                const center = token.center();
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

            const activeFloor = floorStore.currentFloor.value!.id;
            if (this.floor === activeFloor && floorStore.state.floors.length > 1) {
                for (let f = floorStore.state.floors.length - 1; f > floorStore.state.floorIndex; f--) {
                    const floor = floorStore.state.floors[f];
                    if (floor.id === activeFloor) break;
                    const fowl = floorStore.getLayer(floor, this.name);
                    if (fowl === undefined) continue;
                    this.vCtx.globalCompositeOperation = "destination-over";
                    this.vCtx.drawImage(fowl.canvas, 0, 0, window.innerWidth, window.innerHeight);
                    const mapl = floorStore.getLayer(floor, LayerName.Map);
                    if (mapl === undefined) continue;
                    this.vCtx.globalCompositeOperation = "destination-out";
                    this.vCtx.drawImage(mapl.canvas, 0, 0, window.innerWidth, window.innerHeight);
                }
                this.ctx.globalCompositeOperation = "source-over";
                this.ctx.drawImage(this.virtualCanvas, 0, 0, window.innerWidth, window.innerHeight);
            }

            // For the players this is done at the beginning of this function.  TODO: why the split up ???
            // This was done in commit be1e65cff1e7369375fe11cfa1643fab1d11beab.
            if (gameStore.state.isDm) super.draw(false);

            this.ctx.globalCompositeOperation = originalOperation;
        }
    }
}
