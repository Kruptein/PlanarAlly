import type { Canvas, CanvasContext } from "../../canvas";
import type { IShape } from "../../interfaces/shape";
import { LayerName } from "../../models/floor";
import type { FloorId } from "../../models/floor";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { playerSettingsState } from "../../systems/settings/players/state";
// import { createCanvas, setCanvasDimensions } from "../canvas";

import { Layer } from "./layer";

export class FowLayer extends Layer {
    isVisionLayer = true;
    preFogShapes: IShape[] = [];
    virtualCanvas: Canvas;
    vCtx: CanvasContext;
    isEmpty = false;

    constructor(
        canvasInfo: { canvas: Canvas; width: number; height: number },
        public name: LayerName,
        public floor: FloorId,
        protected index: number,
    ) {
        super(canvasInfo, name, floor, index);
        this.virtualCanvas = new OffscreenCanvas(canvasInfo.width, canvasInfo.height);
        this.vCtx = this.virtualCanvas.getContext("2d")!;
    }

    resize(width: number, height: number): void {
        super.resize(width, height);
        // setCanvasDimensions(this.virtualCanvas, width, height);
    }

    _draw(): void {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.vCtx.clearRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";

        const activeFloor = floorState.readonly.currentFloor!.id;

        // if (this.floor === activeFloor && this.canvas.style.display === "none")
        //     this.canvas.style.removeProperty("display");
        // else if (this.floor !== activeFloor && this.canvas.style.display !== "none") this.canvas.style.display = "none";

        if (
            playerSettingsState.raw.renderAllFloors.value &&
            this.floor === activeFloor &&
            floorState.readonly.floors.length > 1
        ) {
            for (const floor of floorState.readonly.floors) {
                if (floor.name !== floorState.readonly.floors[0]!.name) {
                    const mapl = floorSystem.getLayer(floor, LayerName.Map);
                    if (mapl === undefined) continue;
                    this.ctx.globalCompositeOperation = "destination-out";
                    this.ctx.drawImage(mapl.canvas, 0, 0, this.width, this.height);
                }
                if (floor.id !== activeFloor) {
                    const fowl = floorSystem.getLayer(floor, this.name);
                    if (fowl === undefined) continue;
                    this.ctx.globalCompositeOperation = "source-over";
                    this.ctx.drawImage(fowl.canvas, 0, 0, this.width, this.height);
                }
                if (floor.id === activeFloor) break;
            }
        }

        this.ctx.globalCompositeOperation = "source-over";
    }
}
