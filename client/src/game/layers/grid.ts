import { Layer } from "@/game/layers/layer";
import { gameStore } from "@/game/store";

export class GridLayer extends Layer {
    invalidate(): void {
        this.valid = false;
    }
    draw(_doClear?: boolean): void {
        if (!this.valid) {
            this.drawGrid();
        }
    }
    drawGrid(): void {
        const ctx = this.ctx;
        this.clear();
        ctx.beginPath();

        const gs = gameStore.gridSize;

        for (let i = 0; i < this.width; i += gs * gameStore.zoomFactor) {
            ctx.moveTo(i + (gameStore.panX % gs) * gameStore.zoomFactor, 0);
            ctx.lineTo(i + (gameStore.panX % gs) * gameStore.zoomFactor, this.height);
            ctx.moveTo(0, i + (gameStore.panY % gs) * gameStore.zoomFactor);
            ctx.lineTo(this.width, i + (gameStore.panY % gs) * gameStore.zoomFactor);
        }

        ctx.strokeStyle = gameStore.gridColour;
        ctx.lineWidth = 1;
        ctx.stroke();
        this.valid = true;
    }
}
