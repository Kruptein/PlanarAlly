import type { Floor } from "../models/floor";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";

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
    for (const [f, floor] of state.floors.entries()) {
        if (f === state.floorIndex) continue;
        drawFloor(floor);
    }
    // Then process the current floor
    if (floorState.currentFloor !== undefined) {
        drawFloor(floorState.currentFloor.value!);
    }
    for (let i = state.floorIndex; i >= 0; i--) {
        const floor = state.floors[i];
        for (const layer of floorSystem.getLayers(floor)) {
            if (i === state.floorIndex || !layer.isVisionLayer) layer.show();
        }
    }
    _animationFrameId = requestAnimationFrame(drawLoop);
}

function drawFloor(floor: Floor): void {
    for (const layer of floorSystem.getLayers(floor)) {
        layer.hide();
        layer.draw();
    }
}
