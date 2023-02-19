import type { ApiShape } from "../../../apiTypes";
import { toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import { buildState } from "../state";

interface ClipboardState {
    clipboard: ApiShape[];
    clipboardPosition: GlobalPoint;
}

const state = buildState<ClipboardState>({
    clipboard: [],
    clipboardPosition: toGP(0, 0),
});

export const clipboardState = {
    ...state,
};
