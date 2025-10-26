import { toGP } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import { buildState } from "../../../core/systems/state";
import type { FullCompactForm } from "../../shapes/transformations";

interface ClipboardState {
    clipboard: FullCompactForm[];
    clipboardPosition: GlobalPoint;
}

const state = buildState<ClipboardState>({
    clipboard: [],
    clipboardPosition: toGP(0, 0),
});

export const clipboardState = {
    ...state,
};
