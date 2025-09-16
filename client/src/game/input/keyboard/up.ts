import { equalsP } from "../../../core/geometry";
import { map } from "../../../core/iter";
import { SyncMode } from "../../../core/models/types";
import { ctrlOrCmdPressed } from "../../../core/utils";
import { activeShapeStore } from "../../../store/activeShape";
import { getVisualShape } from "../../id";
import { setCenterPosition } from "../../position";
import { deleteShapes } from "../../shapes/utils";
import { accessState } from "../../systems/access/state";
import { floorSystem } from "../../systems/floors";
import { positionSystem } from "../../systems/position";
import { selectedSystem } from "../../systems/selected";

export function onKeyUp(event: KeyboardEvent): Promise<void> {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // no-op (condition is cleaner this way)
    } else {
        if (event.key === "Delete" || event.key === "Del" || event.key === "Backspace") {
            const selection = selectedSystem.get({ includeComposites: true });
            deleteShapes(selection, SyncMode.FULL_SYNC);
        }
        if (event.key === " " || (event.code === "Numpad0" && !ctrlOrCmdPressed(event))) {
            // Spacebar or numpad-zero: cycle through own tokens
            // numpad-zero only if Ctrl is not pressed, as this would otherwise conflict with Ctrl + 0
            const tokens = [...map(accessState.raw.ownedTokens.get("vision") ?? [], (o) => getVisualShape(o)!)];
            if (tokens.length === 0) return Promise.resolve();
            const i = tokens.findIndex((o) => equalsP(o.center, positionSystem.screenCenter));
            const token = tokens[(i + 1) % tokens.length]!;
            setCenterPosition(token.center);
            if (token.floorId !== undefined) floorSystem.selectFloor({ id: token.floorId }, true);
        }
        if (event.key === "Enter") {
            if (selectedSystem.hasSelection) {
                activeShapeStore.setShowEditDialog(true);
            }
        }
    }
    return Promise.resolve();
}
