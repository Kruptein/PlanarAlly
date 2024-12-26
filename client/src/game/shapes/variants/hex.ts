import { type GlobalPoint } from "../../../core/geometry";
import type { GridType } from "../../../core/grid";
import type { GlobalId, LocalId } from "../../../core/id";
import { createHex } from "../../rendering/grid";

import { Polygon } from "./polygon";

export function createHexPolygon(
    center: GlobalPoint,
    size: number,
    grid: { type: GridType; oddHexOrientation: boolean; radius?: number },
    options?: {
        lineWidth?: number[];
        openPolygon?: boolean;
        id?: LocalId;
        uuid?: GlobalId;
        isSnappable?: boolean;
    },
): Polygon {
    const vertices = createHex(center, size, grid);
    if (vertices.length < 2) {
        throw new Error("Hexagon has less than 2 vertices");
    }
    return new Polygon(vertices[0]!, vertices.slice(1), options);
}
