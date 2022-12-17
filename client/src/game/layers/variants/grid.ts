import type { IGridLayer } from "../../interfaces/layers/grid";
import { floorState } from "../../systems/floors/state";
import { DEFAULT_GRID_SIZE, positionState } from "../../systems/position/state";
import { locationSettingsState } from "../../systems/settings/location/state";
import { playerSettingsState } from "../../systems/settings/players/state";

import { Layer } from "./layer";

export class GridLayer extends Layer implements IGridLayer {
    invalidate(): void {
        this.valid = false;
    }

    show(): void {
        if (locationSettingsState.raw.useGrid.value && this.floor === floorState.currentFloor.value!.id)
            this.canvas.style.removeProperty("display");
    }

    draw(_doClear?: boolean): void {
        if (!this.valid) {
            if (locationSettingsState.raw.useGrid.value) {
                const activeFowFloor = floorState.currentFloor.value!.id;

                if (this.floor === activeFowFloor && this.canvas.style.display === "none")
                    this.canvas.style.removeProperty("display");
                else if (this.floor !== activeFowFloor && this.canvas.style.display !== "none")
                    this.canvas.style.display = "none";

                const ctx = this.ctx;
                this.clear();
                ctx.beginPath();

                const state = positionState.readonly;

                if (locationSettingsState.raw.gridType.value === "SQUARE") {
                    for (let i = 0; i < this.width; i += DEFAULT_GRID_SIZE * state.zoom) {
                        ctx.moveTo(i + (state.panX % DEFAULT_GRID_SIZE) * state.zoom, 0);
                        ctx.lineTo(i + (state.panX % DEFAULT_GRID_SIZE) * state.zoom, this.height);
                        ctx.moveTo(0, i + (state.panY % DEFAULT_GRID_SIZE) * state.zoom);
                        ctx.lineTo(this.width, i + (state.panY % DEFAULT_GRID_SIZE) * state.zoom);
                    }
                } else {
                    const s3 = Math.sqrt(3);
                    const centerDistance = DEFAULT_GRID_SIZE * state.zoom;
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

                    const flat = locationSettingsState.raw.gridType.value === "FLAT_HEX";

                    const pX = (state.panX % ((flat ? 3 / s3 : 1) * DEFAULT_GRID_SIZE)) * state.zoom;
                    const pY = (state.panY % ((flat ? 1 : 3 / s3) * DEFAULT_GRID_SIZE)) * state.zoom;

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

                ctx.strokeStyle = playerSettingsState.raw.gridColour.value;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            this.valid = true;
        }
    }
}
