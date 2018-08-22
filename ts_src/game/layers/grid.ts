import { Layer } from "./layer";
import Settings from "../settings";
import store from "../store";

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

        const gs = store.state.gridSize;

        for (let i = 0; i < this.width; i += gs * store.state.zoomFactor) {
            ctx.moveTo(i + (store.state.panX % gs) * store.state.zoomFactor, 0);
            ctx.lineTo(i + (store.state.panX % gs) * store.state.zoomFactor, this.height);
            ctx.moveTo(0, i + (store.state.panY % gs) * store.state.zoomFactor);
            ctx.lineTo(this.width, i + (store.state.panY % gs) * store.state.zoomFactor);
        }

        ctx.strokeStyle = store.state.gridColour;
        ctx.lineWidth = 1;
        ctx.stroke();
        this.valid = true;
    }
}