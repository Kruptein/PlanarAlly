import type { GlobalPoint } from "../../../core/geometry";
import { registerSystem } from "../../../core/systems";
import type { System } from "../../../core/systems/models";
import type { CompactForm } from "../../shapes/transformations";

import { clipboardState } from "./state";

const { mutableReactive: $ } = clipboardState;

class ClipboardSystem implements System {
    clear(): void {}

    setClipboard(clipboard: CompactForm[]): void {
        $.clipboard = clipboard;
    }

    setClipboardPosition(position: GlobalPoint): void {
        $.clipboardPosition = position;
    }
}

export const clipboardSystem = new ClipboardSystem();
registerSystem("clipboard", clipboardSystem, false, clipboardState);
