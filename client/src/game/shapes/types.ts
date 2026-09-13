import type { IShape } from "../interfaces/shape";

import type { BoundingRect } from "./variants/simple/boundingRect";

export type SHAPE_TYPE =
    | "assetrect"
    | "circle"
    | "circulartoken"
    | "fontawesome"
    | "line"
    | "polygon"
    | "rect"
    | "text";

export type DepShape = {
    shape: IShape;
    render: (ctx: CanvasRenderingContext2D, bbox: BoundingRect, depShape: IShape) => void;
};
