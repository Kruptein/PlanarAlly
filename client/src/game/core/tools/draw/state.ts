import { getUnitDistance } from "../../../../core/conversions";
import type { DrawToolState } from "../../../common/tools/draw";
import { locationSettingsState } from "../../systems/settings/location/state";

interface DrawState {
    ui: DrawToolState;
    helperSize: () => number;
}

export const drawCoreState: DrawState = {
    // this is bootstrapped on click/select
    // otherwise we're just duplicating init state here
    ui: undefined as unknown as DrawToolState,
    helperSize,
};

function helperSize(): number {
    // if (this.hasBrushSize.value) return this.state.brushSize / 2;
    return getUnitDistance(locationSettingsState.raw.unitSize.value) / 8;
}
