import earcut from "earcut";

import { GlobalPoint } from "../geom";
import { layerManager } from "../layers/manager";
import { g2lx, g2ly } from "../units";
import { generate } from "./triangulate";

export function draw(vertices: number[], triangles: number[]) {
    const ctx = layerManager.getLayer("draw")!.ctx;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    ctx.lineJoin = "round";
    ctx.moveTo(g2lx(vertices[triangles[0]]), g2ly(vertices[triangles[0] + 1]));
    for (let t = 0; t < triangles.length; t += 3) {
        ctx.moveTo(g2lx(vertices[2 * triangles[t]]), g2ly(vertices[2 * triangles[t] + 1]));
        ctx.lineTo(g2lx(vertices[2 * triangles[t + 1]]), g2ly(vertices[2 * triangles[t + 1] + 1]));
        ctx.lineTo(g2lx(vertices[2 * triangles[t + 2]]), g2ly(vertices[2 * triangles[t + 2] + 1]));
        ctx.lineTo(g2lx(vertices[2 * triangles[t]]), g2ly(vertices[2 * triangles[t] + 1]));
    }

    ctx.closePath();
    ctx.stroke();
}

export function x(dd = []) {
    const g = generate(dd);
    console.log(g);
    const e = earcut(g.vertices, g.holes);
    console.log(e);
    draw(g.vertices, e);
    console.log(getTrig(layerManager.getLayer()!.selection[0].refPoint, g.vertices, e));
}

function inTrig(point: GlobalPoint, trig: number[]) {
    console.log(`Testing ${trig}`);
    const A = -trig[3] * trig[4] + trig[1] * (-trig[2] + trig[4]) + trig[0] * (trig[3] - trig[5]) + trig[2] * trig[5];
    const sign = A < 0 ? -1 : 1;
    const s =
        (trig[1] * trig[4] - trig[0] * trig[5] + (trig[5] - trig[1]) * point.x + (trig[0] - trig[4]) * point.y) * sign;
    if (s < 0) return false;
    const t =
        (trig[0] * trig[3] - trig[1] * trig[2] + (trig[1] - trig[3]) * point.x + (trig[2] - trig[0]) * point.y) * sign;

    return s + t < A * sign;
}

function getTrig(p: GlobalPoint, vertices: number[], triangles: number[]) {
    for (let t = 0; t < triangles.length; t += 3) {
        if (
            inTrig(p, [
                vertices[2 * triangles[t]],
                vertices[2 * triangles[t] + 1],
                vertices[2 * triangles[t + 1]],
                vertices[2 * triangles[t + 1] + 1],
                vertices[2 * triangles[t + 2]],
                vertices[2 * triangles[t + 2] + 1],
            ])
        ) {
            return t;
        }
    }
    return -1;
}
