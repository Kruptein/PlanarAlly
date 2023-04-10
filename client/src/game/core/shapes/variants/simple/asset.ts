import { addP, Vector } from "../../../../../core/geometry";
import type { GlobalPoint } from "../../../../../core/geometry";

export class SimpleAsset {
    constructor(public topleft: GlobalPoint, public w: number, public h: number) {}

    get center(): GlobalPoint {
        return addP(this.topleft, new Vector(this.w / 2, this.h / 2));
    }
}
