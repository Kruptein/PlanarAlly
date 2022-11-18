import type { Floor } from "../models/floor";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { positionSystem } from "../systems/position";
import { positionState } from "../systems/position/state";
import { playerSettingsState } from "../systems/settings/players/state";

let _animationFrameId = 0;

export function startDrawLoop(): void {
    _animationFrameId = requestAnimationFrame(drawLoop);
}

export function stopDrawLoop(): void {
    cancelAnimationFrame(_animationFrameId);
}

function drawLoop(): void {
    const state = floorState.raw;

    // First process all other floors
    if (playerSettingsState.raw.renderAllFloors.value) {
        for (const [f, floor] of state.floors.entries()) {
            if (f === state.floorIndex) continue;
            drawFloor(floor);
        }
    }

    // Then process the current floor
    if (floorState.currentFloor !== undefined) {
        drawFloor(floorState.currentFloor.value!);
    }

    if (positionState.readonly.performOobCheck) {
        positionSystem.checkOutOfBounds();
    }

    _animationFrameId = requestAnimationFrame(drawLoop);
}

function drawFloor(floor: Floor): void {
    for (const layer of floorSystem.getLayers(floor)) {
        layer.draw();
    }
}
