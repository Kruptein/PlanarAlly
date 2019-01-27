import { Ray, Vector } from "@/game/geom";
import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { Settings } from "@/game/settings";
import { gameStore } from "@/game/store";
import { g2l, g2lr, g2lx, g2ly } from "@/game/units";
import { computeVisibility } from "../visibility/te/te";

export class FOWPlayersLayer extends Layer {
    isVisionLayer: boolean = true;

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

            const drctx = layerManager.getLayer("draw")!.ctx;
            drctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            const originalOperation = ctx.globalCompositeOperation;

            ctx.fillStyle = "rgba(0, 0, 0, 1)";

            // For the DM this is done at the end of this function.  TODO: why the split up ???
            // This was done in commit be1e65cff1e7369375fe11cfa1643fab1d11beab.
            if (!gameStore.IS_DM) super.draw(!gameStore.fullFOW);

            // Then cut out all the player vision auras
            const maxLength = ctx.canvas.width + ctx.canvas.height;

            for (const tokenId of gameStore.ownedtokens) {
                const token = layerManager.UUIDMap.get(tokenId);
                if (token === undefined) continue;
                const center = token.center();
                const lcenter = g2l(center);
                if (gameStore.visionMode === "bvh") {
                    ctx.beginPath();
                    let lastArcAngle = -1;

                    for (let angle = 0; angle < 2 * Math.PI; angle += (Settings.angleSteps / 2 / 180) * Math.PI) {
                        const cos = Math.cos(angle);
                        const sin = Math.sin(angle);
                        // Check if there is a hit with one of the nearby light blockers.
                        const lightRay = new Ray(center, new Vector(cos, sin));
                        const hitResult = gameStore.BV.intersect(lightRay);

                        // We can move on to the next angle if nothing was hit.
                        if (!hitResult.hit) {
                            // If an earlier hit caused the aura to leave the arc, we need to go back to the arc
                            if (lastArcAngle === -1) {
                                // Draw a line from the last non arc location back to the arc
                                ctx.lineTo(lcenter.x + maxLength * cos, lcenter.y + maxLength * sin);
                                // Set the start of a new arc beginning at the current angle
                                lastArcAngle = angle;
                            }
                            continue;
                        }
                        // If hit , first finish any ongoing arc, then move to the intersection point
                        if (lastArcAngle !== -1) {
                            ctx.arc(lcenter.x, lcenter.y, maxLength, lastArcAngle, angle);
                            lastArcAngle = -1;
                        }
                        ctx.lineTo(g2lx(hitResult.intersect.x), g2ly(hitResult.intersect.y));
                    }

                    // Finish the final arc.
                    if (lastArcAngle !== -1) ctx.arc(lcenter.x, lcenter.y, maxLength, lastArcAngle, 2 * Math.PI);
                    else ctx.closePath();
                    ctx.fill();
                } else {
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
                        const polygon = computeVisibility(token.center(), "vision");
                        ctx.beginPath();
                        ctx.moveTo(g2lx(polygon[0][0]), g2ly(polygon[0][1]));
                        for (const point of polygon) ctx.lineTo(g2lx(point[0]), g2ly(point[1]));
                        ctx.closePath();
                        ctx.fill();
                    } catch {}
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
