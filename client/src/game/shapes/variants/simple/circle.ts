import { toGP } from "../../../../core/geometry";
import type { GlobalPoint } from "../../../../core/geometry";

import { BoundingRect } from "./boundingRect";

export class SimpleCircle {
    constructor(
        public center: GlobalPoint,
        public r: number,
    ) {}

    getBoundingBox(): BoundingRect {
        return new BoundingRect(toGP(this.center.x - this.r, this.center.y - this.r), this.r * 2, this.r * 2);
    }

    visibleInCanvas(max: { w: number; h: number }): boolean {
        return this.getBoundingBox().visibleInCanvas(max);
    }
}
