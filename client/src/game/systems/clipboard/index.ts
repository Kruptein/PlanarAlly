import { registerSystem } from "..";
import type { System } from "..";
import type { GlobalPoint } from "../../../core/geometry";
import type { ServerShape } from "../../models/shapes";

import { clipboardState } from "./state";

const { mutableReactive: $ } = clipboardState;

class ClipboardSystem implements System {
    clear(): void {}

    setClipboard(clipboard: ServerShape[]): void {
        $.clipboard = clipboard;
    }

    setClipboardPosition(position: GlobalPoint): void {
        $.clipboardPosition = position;
    }
}

export const clipboardSystem = new ClipboardSystem();
registerSystem("clipboard", clipboardSystem, false, clipboardState);
