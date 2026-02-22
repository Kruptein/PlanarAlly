import { AssetId } from "../../../assets/models";
import type { GlobalPoint } from "../../../core/geometry";
import type { IShape } from "../shape";

export interface IAsset extends IShape {
    assetId: AssetId;
    assetHash: string;
    svgData?: { svg: Node; rp: GlobalPoint; paths?: [number, number][][][] }[];

    get h(): number;
    set h(w: number);
    resizeH: (w: number, keepAspectratio: boolean) => void;
    get w(): number;
    set w(w: number);
    resizeW: (w: number, keepAspectratio: boolean) => void;
    setImage: (assetId: AssetId, url: string, sync: boolean) => void;
    loadSvgs: () => Promise<void>;
}
