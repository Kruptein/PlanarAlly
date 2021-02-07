import { Shape } from "../shapes/shape";

import { Layer } from "./layer";
import { layerManager } from "./manager";
import { floorStore } from "./store";

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

    _draw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.vCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";

        const activeFloor = floorStore.currentFloor.id;

        if (this.floor === activeFloor && this.canvas.style.display === "none")
            this.canvas.style.removeProperty("display");
        else if (this.floor !== activeFloor && this.canvas.style.display !== "none") this.canvas.style.display = "none";

        if (this.floor === activeFloor && floorStore.floors.length > 1) {
            for (const floor of floorStore.floors) {
                if (floor.name !== floorStore.floors[0].name) {
                    const mapl = layerManager.getLayer(floor, "map");
                    if (mapl === undefined) continue;
                    this.ctx.globalCompositeOperation = "destination-out";
                    this.ctx.drawImage(mapl.canvas, 0, 0);
                }
                if (floor.id !== activeFloor) {
                    const fowl = layerManager.getLayer(floor, this.name);
                    if (fowl === undefined) continue;
                    this.ctx.globalCompositeOperation = "source-over";
                    this.ctx.drawImage(fowl.canvas, 0, 0);
                }
                if (floor.id === activeFloor) break;
            }
        }

        this.ctx.globalCompositeOperation = "source-over";
    }
}
