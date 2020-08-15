import { Layer } from "./layer";
import { Shape } from "../shapes/shape";

export class FowLayer extends Layer {
    isVisionLayer = true;
    preFogShapes: Shape[] = [];
    virtualCanvas: HTMLCanvasElement;
    vCtx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, public name: string, public floor: number, public index: number) {
        super(canvas, name, floor, index);
        this.virtualCanvas = document.createElement("canvas");
        this.virtualCanvas.width = window.innerWidth;
        this.virtualCanvas.height = window.innerHeight;
        this.vCtx = this.virtualCanvas.getContext("2d")!;
    }

    set width(width: number) {
        super.width = width;
        this.virtualCanvas.width = width;
    }

    set height(height: number) {
        super.height = height;
        this.virtualCanvas.height = height;
    }
}
