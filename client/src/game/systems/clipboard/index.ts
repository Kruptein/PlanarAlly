import { registerSystem } from "..";
import type { System } from "..";
import type { ApiShape } from "../../../apiTypes";
import type { GlobalPoint } from "../../../core/geometry";

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
