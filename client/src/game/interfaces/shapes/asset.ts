import type { GlobalPoint } from "../../../core/geometry";
import type { IShape } from "../shape";

export interface IAsset extends IShape {
    src: string;
    svgData?: Iterable<{ svg: Node; rp: GlobalPoint; paths?: [number, number][][][] }>;

    get h(): number;
    get w(): number;

    loadSvgs: () => Promise<void>;
}
