import { Layer } from "@/game/layers/layer";
import { DEFAULT_GRID_SIZE, gameStore } from "@/game/store";
import { gameSettingsStore } from "../settings";
import { floorStore } from "./store";

export class GridLayer extends Layer {
    invalidate(): void {
        this.valid = false;
    }
    show(): void {
        if (gameSettingsStore.useGrid && this.floor === floorStore.currentFloor.name)
            this.canvas.style.removeProperty("display");
    }
    draw(_doClear?: boolean): void {
        if (!this.valid) {
            if (gameSettingsStore.useGrid) {
                const activeFowFloorName = floorStore.currentFloor.name;

                if (this.floor === activeFowFloorName && this.canvas.style.display === "none")
                    this.canvas.style.removeProperty("display");
                else if (this.floor !== activeFowFloorName && this.canvas.style.display !== "none")
                    this.canvas.style.display = "none";

                const ctx = this.ctx;
                this.clear();
                ctx.beginPath();

                for (let i = 0; i < this.width; i += DEFAULT_GRID_SIZE * gameStore.zoomFactor) {
                    ctx.moveTo(i + (gameStore.panX % DEFAULT_GRID_SIZE) * gameStore.zoomFactor, 0);
                    ctx.lineTo(i + (gameStore.panX % DEFAULT_GRID_SIZE) * gameStore.zoomFactor, this.height);
                    ctx.moveTo(0, i + (gameStore.panY % DEFAULT_GRID_SIZE) * gameStore.zoomFactor);
                    ctx.lineTo(this.width, i + (gameStore.panY % DEFAULT_GRID_SIZE) * gameStore.zoomFactor);
                }

                ctx.strokeStyle = gameStore.gridColour;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            this.valid = true;
        }
    }
}
