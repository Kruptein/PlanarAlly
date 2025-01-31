import type { ApiShape } from "../../../apiTypes";
import type { GlobalPoint } from "../../../core/geometry";
import { registerSystem } from "../../../core/systems";
import type { System } from "../../../core/systems";

import { clipboardState } from "./state";

const { mutableReactive: $ } = clipboardState;

class ClipboardSystem implements System {
    clear(): void {}

    setClipboard(clipboard: ApiShape[]): void {
        $.clipboard = clipboard;
    }

    setClipboardPosition(position: GlobalPoint): void {
        $.clipboardPosition = position;
    }
}

export const clipboardSystem = new ClipboardSystem();
registerSystem("clipboard", clipboardSystem, false, clipboardState);
