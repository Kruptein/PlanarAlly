import { Layer } from "./layer";
import Settings from "../settings";
import { g2l, g2ly, g2lx } from "../units";
import gameManager from "../planarally";
import { Vector, Ray } from "../geom";

export class FOWPlayersLayer extends Layer {
    isVisionLayer: boolean = true;

    draw(): void {
        if (Settings.board_initialised && !this.valid) {            
            const ctx = this.ctx;

            if (!Settings.fowLOS || Settings.skipPlayerFOW) {
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.valid = true;
                return;
            }

            const orig_op = ctx.globalCompositeOperation;

            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            // Fill the entire screen with the desired FOW colour.
            if (Settings.fullFOW && !Settings.IS_DM) {
                this.ctx.globalCompositeOperation = "copy";
                this.ctx.fillStyle = gameManager.fowColour.spectrum("get").setAlpha(1).toRgbString();
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.globalCompositeOperation = 'destination-out';
            }

            // For the DM this is done at the end of this function.  TODO: why the split up ???
            // This was done in commit be1e65cff1e7369375fe11cfa1643fab1d11beab.
            if (!Settings.IS_DM)
                super.draw(!Settings.fullFOW);

            // Then cut out all the player vision auras
            const maxLength = ctx.canvas.width + ctx.canvas.height;
            for (let tokenIndex = 0; tokenIndex < gameManager.ownedtokens.length; tokenIndex++) {
                ctx.beginPath();
                let lastArcAngle = -1;
                const token = gameManager.layerManager.UUIDMap.get(gameManager.ownedtokens[tokenIndex]);
                if (token === undefined) continue;
                const center = token.center();
                const lcenter = g2l(center);
                
                for (let angle = 0; angle < 2 * Math.PI; angle += ((Settings.angleSteps / 2) / 180) * Math.PI) {
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);
                    // Check if there is a hit with one of the nearby light blockers.
                    const lightRay = new Ray(center, new Vector(cos, sin));
                    const hitResult = gameManager.BV.intersect(lightRay);

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
                if (lastArcAngle !== -1)
                    ctx.arc(lcenter.x, lcenter.y, maxLength, lastArcAngle, 2 * Math.PI);
                else
                    ctx.closePath();
                ctx.fillStyle = "rgba(0, 0, 0, 1)";
                ctx.fill();
            }

            // For the players this is done at the beginning of this function.  TODO: why the split up ???
            // This was done in commit be1e65cff1e7369375fe11cfa1643fab1d11beab.
            if (Settings.IS_DM)
                super.draw(!Settings.fullFOW);

            ctx.globalCompositeOperation = orig_op;
        }
    }
}