import { clientStore, DEFAULT_GRID_SIZE } from "../../../store/client";
import { floorStore } from "../../../store/floor";
import { settingsStore } from "../../../store/settings";

import { Layer } from "./layer";

export class GridLayer extends Layer {
    invalidate(): void {
        this.valid = false;
    }
    show(): void {
        if (settingsStore.useGrid.value && this.floor === floorStore.currentFloor.value!.id)
            this.canvas.style.removeProperty("display");
    }
    draw(_doClear?: boolean): void {
        if (!this.valid) {
            if (settingsStore.useGrid.value) {
                const activeFowFloor = floorStore.currentFloor.value!.id;

                if (this.floor === activeFowFloor && this.canvas.style.display === "none")
                    this.canvas.style.removeProperty("display");
                else if (this.floor !== activeFowFloor && this.canvas.style.display !== "none")
                    this.canvas.style.display = "none";

                const ctx = this.ctx;
                this.clear();
                ctx.beginPath();

                if (settingsStore.gridType.value === "SQUARE") {
                    for (let i = 0; i < this.width; i += DEFAULT_GRID_SIZE * clientStore.zoomFactor.value) {
                        ctx.moveTo(i + (clientStore.state.panX % DEFAULT_GRID_SIZE) * clientStore.zoomFactor.value, 0);
                        ctx.lineTo(
                            i + (clientStore.state.panX % DEFAULT_GRID_SIZE) * clientStore.zoomFactor.value,
                            this.height,
                        );
                        ctx.moveTo(0, i + (clientStore.state.panY % DEFAULT_GRID_SIZE) * clientStore.zoomFactor.value);
                        ctx.lineTo(
                            this.width,
                            i + (clientStore.state.panY % DEFAULT_GRID_SIZE) * clientStore.zoomFactor.value,
                        );
                    }
                } else {
                    const s3 = Math.sqrt(3);
                    const centerDistance = DEFAULT_GRID_SIZE * clientStore.zoomFactor.value;
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

                    const flat = settingsStore.gridType.value === "FLAT_HEX";

                    const pX =
                        (clientStore.state.panX % ((flat ? 3 / s3 : 1) * DEFAULT_GRID_SIZE)) *
                        clientStore.zoomFactor.value;
                    const pY =
                        (clientStore.state.panY % ((flat ? 1 : 3 / s3) * DEFAULT_GRID_SIZE)) *
                        clientStore.zoomFactor.value;

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

                ctx.strokeStyle = clientStore.state.gridColour;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            this.valid = true;
        }
    }
}
