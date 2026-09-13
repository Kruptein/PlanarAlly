import type { ApiAddVariant } from "../../../apiTypes";
import { socket } from "../../api/socket";
import { getLocalId } from "../../id";

import { variantsSystem } from ".";

socket.on("Shape.Variants.Add", (data: ApiAddVariant): void => {
    const shape = getLocalId(data.shapeId);
    if (shape === undefined) return;
    variantsSystem.add(shape, data);
});

socket.on("Shape.Variants.Update", (data: ApiAddVariant): void => {
    const { shapeId, ...variantData } = data;
    const localShapeId = getLocalId(shapeId);
    if (localShapeId === undefined) return;
    variantsSystem.update(localShapeId, variantData, false);
});
