import { DEFAULT_HEX_RADIUS, DEFAULT_GRID_SIZE, SQRT3, GridType } from "../../../core/grid";
import type { IGridLayer } from "../../interfaces/layers/grid";
import { floorState } from "../../systems/floors/state";
import { positionState } from "../../systems/position/state";
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

                if (locationSettingsState.raw.gridType.value === GridType.Square) {
                    const zoomed_grid_size = DEFAULT_GRID_SIZE * state.zoom;
                    for (let i = 0; i < this.height; i += zoomed_grid_size) {
                        let pan_size = state.panY % DEFAULT_GRID_SIZE;
                        if (pan_size < 0) pan_size += DEFAULT_GRID_SIZE;
                        const zoomed_pan_size = pan_size * state.zoom;
                        ctx.moveTo(0, i + zoomed_pan_size);
                        ctx.lineTo(this.width, i + zoomed_pan_size);
                    }
                    for (let i = 0; i < this.width; i += zoomed_grid_size) {
                        let pan_size = state.panX % DEFAULT_GRID_SIZE;
                        if (pan_size < 0) pan_size += DEFAULT_GRID_SIZE;
                        const zoomed_pan_size = pan_size * state.zoom;
                        ctx.moveTo(i + zoomed_pan_size, 0);
                        ctx.lineTo(i + zoomed_pan_size, this.height);
                    }
                } else {
                    const side = DEFAULT_HEX_RADIUS * state.zoom;
                    const SECONDARY_SIZE = SQRT3 * side;
                    const SECONDARY_HALF = SECONDARY_SIZE / 2;

                    /*
                     * To draw hexagons we follow a similar idea as square grids where we don't render each hex by itself.
                     * Instead we draw segments of \_/ (for flat) to make sure we're not wasting time drawing lines double.
                     *
                     * The below code is the merge of pointy and flat topped hexagons as they are completely similar in logic,
                     * but differ in primary axis.
                     */

                    const flat = locationSettingsState.raw.gridType.value === GridType.FlatHex;

                    const pX = (state.panX % ((flat ? 3 / SQRT3 : 1) * DEFAULT_GRID_SIZE)) * state.zoom;
                    const pY = (state.panY % ((flat ? 1 : 3 / SQRT3) * DEFAULT_GRID_SIZE)) * state.zoom;

                    const primaryAxisLimit = (flat ? this.width : this.height) / (2 * side);
                    const secondaryAxisLimit = (flat ? this.height : this.width) / SECONDARY_HALF;

                    for (let i = -2; i <= secondaryAxisLimit + 2; i++) {
                        // Division by 2 as we do a zigzag pattern of rows (pointy) / cols (flat)
                        const secondaryDelta = (SQRT3 / 2) * i * side;
                        // We need to take the zigzag (i%2) into account
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
