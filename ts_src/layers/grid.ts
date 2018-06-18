import { Layer } from "./layer";
import Settings from "../settings";
import gameManager from "../planarally";

export class GridLayer extends Layer {
    invalidate(): void {
        this.valid = false;
    }
    draw(doClear?: boolean): void {
        if (Settings.board_initialised && !this.valid) {
            this.drawGrid();
        }
    }
    drawGrid(): void {
        const ctx = this.ctx;
        this.clear();
        ctx.beginPath();

        for (let i = 0; i < this.width; i += Settings.gridSize * Settings.zoomFactor) {
            ctx.moveTo(i + (Settings.panX % Settings.gridSize) * Settings.zoomFactor, 0);
            ctx.lineTo(i + (Settings.panX % Settings.gridSize) * Settings.zoomFactor, this.height);
            ctx.moveTo(0, i + (Settings.panY % Settings.gridSize) * Settings.zoomFactor);
            ctx.lineTo(this.width, i + (Settings.panY % Settings.gridSize) * Settings.zoomFactor);
        }

        ctx.strokeStyle = gameManager.gridColour.spectrum("get").toRgbString();
        ctx.lineWidth = 1;
        ctx.stroke();
        this.valid = true;
    }
}