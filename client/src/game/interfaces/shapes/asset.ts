import { AssetId } from "../../../assets/models";
import type { GlobalPoint } from "../../../core/geometry";
import type { IShape } from "../shape";

export interface IAsset extends IShape {
    src: string;
    variants: { name: string | null; assetId: AssetId; width: number; height: number }[];
    svgData?: { svg: Node; rp: GlobalPoint; paths?: [number, number][][][] }[];

    get h(): number;
    set h(w: number);
    resizeH: (w: number, keepAspectratio: boolean) => void;
    get w(): number;
    set w(w: number);
    resizeW: (w: number, keepAspectratio: boolean) => void;

    loadSvgs: () => Promise<void>;
}
