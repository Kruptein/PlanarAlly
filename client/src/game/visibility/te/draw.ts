import { layerManager } from "@/game/layers/manager";
import { g2lx, g2ly } from "@/game/units";

export function drawPolygon(polygon: number[][], colour?: string) {
    const dl = layerManager.getLayer("draw");
    if (dl === undefined) return;
    const ctx = dl.ctx;
    ctx.lineJoin = "round";
    // ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.strokeStyle =
        colour === undefined ? `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})` : colour;
    ctx.moveTo(g2lx(polygon[0][0]), g2ly(polygon[0][1]));
    for (const point of polygon) {
        ctx.lineTo(g2lx(point[0]), g2ly(point[1]));
    }
    ctx.closePath();
    ctx.stroke();
}

(<any>window).DP = drawPolygon;
