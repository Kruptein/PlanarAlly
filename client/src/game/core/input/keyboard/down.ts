import { Vector } from "../../../../core/geometry";
import { sendClientLocationOptions } from "../../api/emits/client";
import { calculateDelta } from "../../drag";
import { moveShapes } from "../../operations/movement";
import { floorSystem } from "../../systems/floors";
import { gameState } from "../../systems/game/state";
import { positionSystem } from "../../systems/position";
import { DEFAULT_GRID_SIZE } from "../../systems/position/state";
import { selectedSystem } from "../../systems/selected";
import { locationSettingsState } from "../../systems/settings/location/state";

export async function keyboardPan(code: string, shiftPressed: boolean): Promise<void> {
    // Arrow keys & Numpad 1-4/6-9 - move the selection or the camera
    // todo: this should already be rounded
    const gridSize = DEFAULT_GRID_SIZE;
    let offsetX = 0;
    let offsetY = 0;
    const left = ["ArrowLeft", "Numpad1", "Numpad4", "Numpad7"];
    const right = ["ArrowRight", "Numpad3", "Numpad6", "Numpad9"];
    const up = ["ArrowUp", "Numpad7", "Numpad8", "Numpad9"];
    const down = ["ArrowDown", "Numpad1", "Numpad2", "Numpad3"];
    if (left.includes(code)) {
        offsetX -= gridSize;
    }
    if (right.includes(code)) {
        offsetX += gridSize;
    }
    if (up.includes(code)) {
        offsetY -= gridSize;
    }
    if (down.includes(code)) {
        offsetY += gridSize;
    }
    // in hex mode, if movement is diagonal, offsets have to be modified
    if (locationSettingsState.raw.gridType.value === "FLAT_HEX" && offsetX != 0) {
        offsetX = (1.5 * offsetX) / Math.sqrt(3);
        offsetY *= 0.5;
    } else if (locationSettingsState.raw.gridType.value === "POINTY_HEX" && offsetY != 0) {
        offsetX *= 0.5;
        offsetY = (1.5 * offsetY) / Math.sqrt(3);
    }
    if (selectedSystem.hasSelection) {
        // if in hex-mode, first invalidate invalid axis
        const flatHexInvalid = ["ArrowLeft", "ArrowRight", "Numpad4", "Numpad6"];
        const pointyHexInvalid = ["ArrowUp", "ArrowDown", "Numpad2", "Numpad8"];
        if (locationSettingsState.raw.gridType.value === "FLAT_HEX" && flatHexInvalid.includes(code)) {
            offsetX = 0;
        } else if (locationSettingsState.raw.gridType.value === "POINTY_HEX" && pointyHexInvalid.includes(code)) {
            offsetY = 0;
        }
        const selection = selectedSystem.get({ includeComposites: false });
        let delta = new Vector(offsetX, offsetY);
        if (!shiftPressed || !gameState.raw.isDm) {
            // First check for collisions.  Using the smooth wall slide collision check used on mouse move is overkill here.
            for (const sel of selection) {
                delta = calculateDelta(delta, sel, true);
            }
        }
        if (delta.length() === 0) return;

        await moveShapes(selection, delta, false);
        (toolMap[ToolName.Select] as ISelectTool).resetRotationHelper();
    } else {
        // The pan offsets should be in the opposite direction to give the correct feel.
        positionSystem.increasePan(offsetX * -1, offsetY * -1);
        floorSystem.invalidateAllFloors();
        sendClientLocationOptions(false);
    }
}
