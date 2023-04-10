// import { toGP } from "../../../../core/geometry";
// import { FULL_SYNC } from "../../../../core/models/types";
import { ctrlOrCmdPressed } from "../../../../core/utils";
// import { redoOperation, undoOperation } from "../../../core/operations/undo";
// import { setCenterPosition } from "../../../core/position";
// import { copyShapes, pasteShapes } from "../../../core/shapes/utils";
// import { accessSystem } from "../../../core/systems/access";
// import { propertiesSystem } from "../../../core/systems/properties";
// import { getProperties } from "../../../core/systems/properties/state";
// import { selectedSystem } from "../../../core/systems/selected";
// import { uiSystem } from "../../../core/systems/ui";
import { postRender } from "../../../messages/render";
import { uiFloorState } from "../../state/floor";
import { uiGameState } from "../../state/game";
import { toggleActiveMode } from "../../tools/tools";

export async function onKeyDown(event: KeyboardEvent): Promise<void> {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // Ctrl-a with a HTMLInputElement or a HTMLTextAreaElement selected - select all the text
        if (event.key === "a" && ctrlOrCmdPressed(event)) event.target.select();
    } else {
        const navKeys = [
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Numpad1",
            "Numpad2",
            "Numpad3",
            "Numpad4",
            "Numpad6",
            "Numpad7",
            "Numpad8",
            "Numpad9",
        ];
        if (navKeys.includes(event.code)) {
            await postRender("Keyboard.Pan", { code: event.code, shiftPressed: event.shiftKey });
        } else if (event.key === "d") {
            // d - Deselect all
            await postRender("Keyboard.Deselect", {});
        } else if (event.key === "x") {
            // x - Mark Defeated
            // const selection = selectedSystem.get({ includeComposites: true });
            // for (const shape of selection) {
            //     if (accessSystem.hasAccessTo(shape.id, false, { edit: true })) {
            //         const isDefeated = getProperties(shape.id)!.isDefeated;
            //         propertiesSystem.setIsDefeated(shape.id, !isDefeated, FULL_SYNC);
            //     }
            // }
            // event.preventDefault();
            // event.stopPropagation();
        } else if (event.key === "l" && ctrlOrCmdPressed(event)) {
            // const selection = selectedSystem.get({ includeComposites: true });
            // for (const shape of selection) {
            //     if (accessSystem.hasAccessTo(shape.id, false, { edit: true })) {
            //         // This and GroupSettings are the only places currently where we would need to update both UI and Server.
            //         // Might need to introduce a SyncTo.BOTH
            //         const isLocked = getProperties(shape.id)!.isLocked;
            //         propertiesSystem.setLocked(shape.id, !isLocked, FULL_SYNC);
            //     }
            // }
            // event.preventDefault();
            // event.stopPropagation();
        } else if (event.key === "u" && ctrlOrCmdPressed(event)) {
            // Ctrl-u - disable and reenable the Interface
            // event.preventDefault();
            // event.stopPropagation();
            // uiSystem.toggleUi();
        } else if (event.key === "0" && ctrlOrCmdPressed(event)) {
            // Ctrl-0 or numpad 0 - Re-center/reset the viewport
            // setCenterPosition(toGP(0, 0));
        } else if (event.code === "Numpad5") {
            // numpad 5 will center on selected shape(s) or on origin
            // let targetX = 0;
            // let targetY = 0;
            // if (selectedSystem.hasSelection) {
            //     const selection = selectedSystem.get({ includeComposites: false });
            //     for (const sel of selection) {
            //         targetX += sel.refPoint.x;
            //         targetY += sel.refPoint.y;
            //     }
            //     targetX /= selection.length;
            //     targetY /= selection.length;
            // }
            // setCenterPosition(toGP(targetX, targetY));
        } else if (event.key === "c" && ctrlOrCmdPressed(event)) {
            // Ctrl-c - Copy
            // copyShapes();
        } else if (event.key === "v" && ctrlOrCmdPressed(event)) {
            // Ctrl-v - Paste
            // pasteShapes();
        } else if (event.key.toLocaleLowerCase() === "z" && event.shiftKey && ctrlOrCmdPressed(event)) {
            // await redoOperation();
            // event.preventDefault();
            // event.stopPropagation();
        } else if (event.key === "z" && ctrlOrCmdPressed(event)) {
            // await undoOperation();
            // event.preventDefault();
            // event.stopPropagation();
        } else if (event.key === "PageUp" && uiFloorState.raw.floorIndex < uiFloorState.raw.floors.length - 1) {
            // Page Up - Move floor up
            // Alt + Page Up - Move selected shapes floor up
            // Alt + Shift + Page Up - Move selected shapes floor up AND move floor up
            event.preventDefault();
            event.stopPropagation();
            const targetFloor = uiFloorState.raw.floors.findIndex(
                (f, i) => i > uiFloorState.raw.floorIndex && (uiGameState.raw.isDm || f.playerVisible),
            );

            await postRender("Floor.Change", { targetFloor, altPressed: event.altKey, shiftPressed: event.shiftKey });
        } else if (event.key === "PageDown" && uiFloorState.raw.floorIndex > 0) {
            // Page Down - Move floor down
            // Alt + Page Down - Move selected shape floor down
            // Alt + Shift + Page Down - Move selected shapes floor down AND move floor down
            event.preventDefault();
            event.stopPropagation();
            const maxLength = uiFloorState.raw.floors.length - 1;
            let targetFloor = [...uiFloorState.raw.floors]
                .reverse()
                .findIndex(
                    (f, i) => maxLength - i < uiFloorState.raw.floorIndex && (uiGameState.raw.isDm || f.playerVisible),
                );
            targetFloor = maxLength - targetFloor;

            await postRender("Floor.Change", { targetFloor, altPressed: event.altKey, shiftPressed: event.shiftKey });
        } else if (event.key === "Tab") {
            event.preventDefault();
            toggleActiveMode();
        }
    }
}
