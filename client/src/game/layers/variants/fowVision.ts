import { g2l, g2lr } from "../../../core/conversions";
import { getShape } from "../../id";
import { LayerName } from "../../models/floor";
import { accessState } from "../../systems/access/state";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { gameState } from "../../systems/game/state";
import { locationSettingsState } from "../../systems/settings/location/state";
import { playerSettingsState } from "../../systems/settings/players/state";

import { FowLayer } from "./fow";

export class FowVisionLayer extends FowLayer {
    draw(): void {
        if (!this.valid) {
            const originalOperation = this.ctx.globalCompositeOperation;

            if (!locationSettingsState.raw.fowLos.value) {
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

            for (const tokenId of accessState.activeTokens.value) {
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
                for (const sh of token._lightBlockingNeighbours) {
                    const hitShape = getShape(sh);
                    if (hitShape) {
                        hitShape.draw(this.ctx, true);
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
