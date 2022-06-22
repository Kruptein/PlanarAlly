import type { ILayer } from "../layer";

export interface IGridLayer extends ILayer {
    invalidate(skipLightUpdate?: boolean): void;
}
