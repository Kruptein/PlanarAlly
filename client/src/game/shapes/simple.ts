import type { ApiShape } from "../../apiTypes";
import { toGP } from "../../core/geometry";
import type { SimpleShape } from "../interfaces/shape";
import type { ServerAsset } from "../models/shapes";

import { SimpleAsset } from "./variants/simple/asset";

export function createSimpleShapeFromDict(shape: ApiShape): SimpleShape | undefined {
    let sh: SimpleShape;
    // Shape Type specifics

    const refPoint = toGP(shape.x, shape.y);
    if (shape.type_ === "assetrect") {
        const asset = shape as ServerAsset;
        sh = new SimpleAsset(refPoint, asset.width, asset.height);
    } else {
        console.warn("Simple shape creation attempted for unknown type", shape.type_);
        return undefined;
    }
    return sh;
}
