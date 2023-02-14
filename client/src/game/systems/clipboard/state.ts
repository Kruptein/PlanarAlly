import { toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import type { ServerShape } from "../../models/shapes";
import { buildState } from "../state";

interface ClipboardState {
    clipboard: ServerShape[];
    clipboardPosition: GlobalPoint;
}

const state = buildState<ClipboardState>({
    clipboard: [],
    clipboardPosition: toGP(0, 0),
});

export const clipboardState = {
    ...state,
};
