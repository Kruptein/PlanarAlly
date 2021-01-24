import { Layer } from "@/game/layers/layer";
import { DEFAULT_GRID_SIZE, gameStore } from "@/game/store";

import { gameSettingsStore } from "../settings";

import { floorStore } from "./store";

export class GridLayer extends Layer {
    invalidate(): void {
        this.valid = false;
    }
    show(): void {
        if (gameSettingsStore.useGrid && this.floor === floorStore.currentFloor.id)
            this.canvas.style.removeProperty("display");
    }
    draw(_doClear?: boolean): void {
        if (!this.valid) {
            if (gameSettingsStore.useGrid) {
                const activeFowFloor = floorStore.currentFloor.id;

                if (this.floor === activeFowFloor && this.canvas.style.display === "none")
                    this.canvas.style.removeProperty("display");
                else if (this.floor !== activeFowFloor && this.canvas.style.display !== "none")
                    this.canvas.style.display = "none";

                const ctx = this.ctx;
                this.clear();
                ctx.beginPath();

                if (gameSettingsStore.gridType === "SQUARE") {
                    for (let i = 0; i < this.width; i += DEFAULT_GRID_SIZE * gameStore.zoomFactor) {
                        ctx.moveTo(i + (gameStore.panX % DEFAULT_GRID_SIZE) * gameStore.zoomFactor, 0);
                        ctx.lineTo(i + (gameStore.panX % DEFAULT_GRID_SIZE) * gameStore.zoomFactor, this.height);
                        ctx.moveTo(0, i + (gameStore.panY % DEFAULT_GRID_SIZE) * gameStore.zoomFactor);
                        ctx.lineTo(this.width, i + (gameStore.panY % DEFAULT_GRID_SIZE) * gameStore.zoomFactor);
                    }
                } else {
                    const s3 = Math.sqrt(3);
                    const centerDistance = DEFAULT_GRID_SIZE * gameStore.zoomFactor;
                    const side = centerDistance / s3;
                    const SECONDARY_SIZE = s3 * side;
                    const SECONDARY_HALF = SECONDARY_SIZE / 2;

                    /*
                     * To draw hexagons we follow a similar idea as square grids where we don't render each hex by itself.
                     * Instead we draw segments of \_/ (for flat) to make sure we're not wasting time drawing lines double.
                     *
                     * The below code is the merge of pointy and flat topped hexagons as they are completely similar in logic,
                     * but differ in primary axis.
                     */

                    const flat = gameSettingsStore.gridType === "FLAT_HEX";

                    const pX = (gameStore.panX % ((flat ? 3 / s3 : 1) * DEFAULT_GRID_SIZE)) * gameStore.zoomFactor;
                    const pY = (gameStore.panY % ((flat ? 1 : 3 / s3) * DEFAULT_GRID_SIZE)) * gameStore.zoomFactor;

                    const primaryAxisLimit = (flat ? this.width : this.height) / (2 * side);
                    const secondaryAxisLimit = (flat ? this.height : this.width) / SECONDARY_HALF;

                    for (let i = -2; i <= secondaryAxisLimit + 2; i++) {
                        const secondaryDelta = (s3 / 2) * i * side;
                        const primaryDelta = i % 2 === 0 ? 0 : 1.5 * side;
                        for (let j = -2; j < primaryAxisLimit; j++) {
                            const s1 = secondaryDelta;
                            const s2 = SECONDARY_HALF + secondaryDelta;
                            const primaryPosition = j * 3 * side + primaryDelta;
                            const a = primaryPosition;
                            const b = primaryPosition + 0.5 * side;
                            const c = primaryPosition + 1.5 * side;
                            const d = primaryPosition + 2 * side;
                            ctx.moveTo((flat ? a : s1) + pX, (flat ? s1 : a) + pY);
                            ctx.lineTo((flat ? b : s2) + pX, (flat ? s2 : b) + pY);
                            ctx.lineTo((flat ? c : s2) + pX, (flat ? s2 : c) + pY);
                            ctx.lineTo((flat ? d : s1) + pX, (flat ? s1 : d) + pY);
                        }
                    }
                }

                ctx.strokeStyle = gameStore.gridColour;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            this.valid = true;
        }
    }
}
