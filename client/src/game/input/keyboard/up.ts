import { equalsP } from "../../../core/geometry";
import { SyncMode } from "../../../core/models/types";
import { ctrlOrCmdPressed } from "../../../core/utils";
import { activeShapeStore } from "../../../store/activeShape";
import { clientStore } from "../../../store/client";
import { getShape } from "../../id";
import { setCenterPosition } from "../../position";
import { deleteShapes } from "../../shapes/utils";
import { accessState } from "../../systems/access/state";
import { floorSystem } from "../../systems/floors";
import { selectedSystem } from "../../systems/selected";

export function onKeyUp(event: KeyboardEvent): void {
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
            const tokens = [...accessState.reactive.ownedTokens].map((o) => getShape(o)!);
            if (tokens.length === 0) return;
            const i = tokens.findIndex((o) => equalsP(o.center(), clientStore.screenCenter));
            const token = tokens[(i + 1) % tokens.length];
            setCenterPosition(token.center());
            floorSystem.selectFloor({ name: token.floor.name }, true);
        }
        if (event.key === "Enter") {
            if (selectedSystem.hasSelection) {
                activeShapeStore.setShowEditDialog(true);
            }
        }
    }
}
