import { l2gz } from "../../../../core/conversions";
import type { GlobalPoint } from "../../../../core/geometry";
import { SelectFeatures } from "../../../dom/tools/models/select";
import { postUi } from "../../../messages/ui";
import type { ToolFeatures } from "../../models/tools";
import { selectedSystem } from "../../systems/selected";
import { hasFeature } from "../feature";

import { selectRotation } from "./rotation";

function updateCursor(globalMouse: GlobalPoint, features: ToolFeatures<SelectFeatures>): void {
    let cursorStyle: string | undefined = undefined;
    const layerSelection = selectedSystem.get({ includeComposites: false });
    for (const sel of layerSelection) {
        const resizePoint = sel.getPointIndex(globalMouse, l2gz(4));
        if (resizePoint < 0) {
            // test rotate case
            cursorStyle = selectRotation.getCursor(globalMouse);
        } else {
            let angle = sel.getPointOrientation(resizePoint).deg();
            if (angle < 0) angle += 360;
            const d = 45 / 2;
            if (angle >= 315 + d || angle < d || (angle >= 135 + d && angle < 225 - d)) cursorStyle = "ew-resize";
            if ((angle >= 45 + d && angle < 135 - d) || (angle >= 225 + d && angle < 315 - d))
                cursorStyle = "ns-resize";
            if ((angle >= d && angle < 90 - d) || (angle >= 180 + d && angle < 270 - d)) cursorStyle = "nwse-resize";
            if ((angle >= 90 + d && angle < 180 - d) || (angle >= 270 + d && angle < 360 - d))
                cursorStyle = "nesw-resize";
        }
    }
    postUi("Cursor.Set", cursorStyle ?? "default");
    if (hasFeature(SelectFeatures.PolygonEdit, features)) {
        // this.updatePolygonEditUi(globalMouse);
    }
}

export const selectCursor = {
    updateCursor,
};
