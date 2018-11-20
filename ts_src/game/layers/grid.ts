import store from "../../store";

import { Layer } from "./layer";

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

        const gs = store.state.game.gridSize;

        for (let i = 0; i < this.width; i += gs * store.state.game.zoomFactor) {
            ctx.moveTo(i + (store.state.game.panX % gs) * store.state.game.zoomFactor, 0);
            ctx.lineTo(i + (store.state.game.panX % gs) * store.state.game.zoomFactor, this.height);
            ctx.moveTo(0, i + (store.state.game.panY % gs) * store.state.game.zoomFactor);
            ctx.lineTo(this.width, i + (store.state.game.panY % gs) * store.state.game.zoomFactor);
        }

        ctx.strokeStyle = store.state.game.gridColour;
        ctx.lineWidth = 1;
        ctx.stroke();
        this.valid = true;
    }
}
