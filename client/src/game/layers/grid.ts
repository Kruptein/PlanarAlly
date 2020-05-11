import { Layer } from "@/game/layers/layer";
import { gameStore } from "@/game/store";
import { gameSettingsStore } from "../settings";
import { layerManager } from "./manager";

export class GridLayer extends Layer {
    invalidate(): void {
        this.valid = false;
    }
    show(): void {
        if (gameSettingsStore.useGrid && this.floor === layerManager.floor?.name)
            this.canvas.style.removeProperty("display");
    }
    draw(_doClear?: boolean): void {
        if (!this.valid) {
            if (gameSettingsStore.useGrid) {
                const activeFowFloorName = layerManager.floor?.name;

                if (this.floor === activeFowFloorName && this.canvas.style.display === "none")
                    this.canvas.style.removeProperty("display");
                else if (this.floor !== activeFowFloorName && this.canvas.style.display !== "none")
                    this.canvas.style.display = "none";

                const ctx = this.ctx;
                this.clear();
                ctx.beginPath();

                const gs = gameSettingsStore.gridSize;
                if (gs <= 0 || gs === undefined) {
                    throw new Error("Grid size is not set, while grid is enabled.");
                }

                for (let i = 0; i < this.width; i += gs * gameStore.zoomFactor) {
                    ctx.moveTo(i + (gameStore.panX % gs) * gameStore.zoomFactor, 0);
                    ctx.lineTo(i + (gameStore.panX % gs) * gameStore.zoomFactor, this.height);
                    ctx.moveTo(0, i + (gameStore.panY % gs) * gameStore.zoomFactor);
                    ctx.lineTo(this.width, i + (gameStore.panY % gs) * gameStore.zoomFactor);
                }

                ctx.strokeStyle = gameStore.gridColour;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            this.valid = true;
        }
    }
}
