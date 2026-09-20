import type { Floor } from "../models/floor";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { positionSystem } from "../systems/position";
import { positionState } from "../systems/position/state";
import { playerSettingsState } from "../systems/settings/players/state";

import { renderingState } from "./state";

let _animationFrameId = 0;
let lastDrawMs = 0;

export function startDrawLoop(): void {
    _animationFrameId = requestAnimationFrame(drawLoop);
}

export function stopDrawLoop(): void {
    cancelAnimationFrame(_animationFrameId);
    lastDrawMs = 0;
}

/** Resolution scale to use for a pan/zoom gesture, or `null` to keep full quality. */
export function getGestureScale(): number | null {
    if (lastDrawMs > 24) return 0.5;
    if (lastDrawMs > 12) return 0.75;
    return null;
}

function drawLoop(): void {
    const state = floorState.raw;
    const t0 = performance.now();

    let requiredRedraw = false;

    // First process all other floors
    if (playerSettingsState.raw.renderAllFloors.value) {
        for (const [f, floor] of state.floors.entries()) {
            if (f === state.floorIndex) continue;
            const floorRedrawn = drawFloor(floor);
            requiredRedraw ||= floorRedrawn;
        }
    }

    // Then process the current floor
    if (floorState.currentFloor !== undefined) {
        const floorRedrawn = drawFloor(floorState.currentFloor.value!);
        requiredRedraw ||= floorRedrawn;
    }

    if (positionState.readonly.performOobCheck) {
        positionSystem.checkOutOfBounds();
    }

    const dt = performance.now() - t0;
    if (renderingState.raw.gestureScale === null && requiredRedraw) {
        lastDrawMs = lastDrawMs === 0 ? dt : lastDrawMs * 0.8 + dt * 0.2;
    }

    _animationFrameId = requestAnimationFrame(drawLoop);
}

function drawFloor(floor: Floor): boolean {
    let requiredRedraw = false;
    for (const layer of floorSystem.getLayers(floor)) {
        requiredRedraw ||= !layer.isValid();
        layer.draw();
    }
    return requiredRedraw;
}
