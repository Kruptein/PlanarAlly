import store from "@/game/store";

import { Layer } from "@/game/layers/layer";

export class GridLayer extends Layer {
    invalidate(): void {
        this.valid = false;
    }
    draw(doClear?: boolean): void {
        if (!this.valid) {
            this.drawGrid();
        }
    }
    drawGrid(): void {
        const ctx = this.ctx;
        this.clear();
        ctx.beginPath();

        const gs = store.gridSize;

        for (let i = 0; i < this.width; i += gs * store.zoomFactor) {
            ctx.moveTo(i + (store.panX % gs) * store.zoomFactor, 0);
            ctx.lineTo(i + (store.panX % gs) * store.zoomFactor, this.height);
            ctx.moveTo(0, i + (store.panY % gs) * store.zoomFactor);
            ctx.lineTo(this.width, i + (store.panY % gs) * store.zoomFactor);
        }

        ctx.strokeStyle = store.gridColour;
        ctx.lineWidth = 1;
        ctx.stroke();
        this.valid = true;
    }
}
