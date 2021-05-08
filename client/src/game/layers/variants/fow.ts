import { floorStore } from "../../../store/floor";
import { LayerName } from "../../models/floor";
import { Shape } from "../../shapes/shape";
import { createCanvas } from "../canvas";

import { Layer } from "./layer";

export class FowLayer extends Layer {
    isVisionLayer = true;
    preFogShapes: Shape[] = [];
    virtualCanvas: HTMLCanvasElement;
    vCtx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, public name: LayerName, public floor: number, protected index: number) {
        super(canvas, name, floor, index);
        this.virtualCanvas = createCanvas();
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

        const activeFloor = floorStore.currentFloor.value!.id;

        if (this.floor === activeFloor && this.canvas.style.display === "none")
            this.canvas.style.removeProperty("display");
        else if (this.floor !== activeFloor && this.canvas.style.display !== "none") this.canvas.style.display = "none";

        if (this.floor === activeFloor && floorStore.state.floors.length > 1) {
            for (const floor of floorStore.state.floors) {
                if (floor.name !== floorStore.state.floors[0].name) {
                    const mapl = floorStore.getLayer(floor, LayerName.Map);
                    if (mapl === undefined) continue;
                    this.ctx.globalCompositeOperation = "destination-out";
                    this.ctx.drawImage(mapl.canvas, 0, 0, window.innerWidth, window.innerHeight);
                }
                if (floor.id !== activeFloor) {
                    const fowl = floorStore.getLayer(floor, this.name);
                    if (fowl === undefined) continue;
                    this.ctx.globalCompositeOperation = "source-over";
                    this.ctx.drawImage(fowl.canvas, 0, 0, window.innerWidth, window.innerHeight);
                }
                if (floor.id === activeFloor) break;
            }
        }

        this.ctx.globalCompositeOperation = "source-over";
    }
}
