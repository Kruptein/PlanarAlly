import { layerManager } from "@/game/layers/manager";
import { g2lx, g2ly } from "@/game/units";

import { floorStore } from "../../layers/store";

import { Edge, EdgeIterator, TDS } from "./tds";
import { ccw, cw } from "./triag";

function drawPoint(point: number[], r: number, colour?: string): void {
    const dl = layerManager.getLayer(floorStore.currentFloor, "draw");
    if (dl === undefined) return;
    const ctx = dl.ctx;
    ctx.lineJoin = "round";
    ctx.strokeStyle =
        colour === undefined ? `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})` : colour;
    ctx.moveTo(g2lx(point[0]), g2ly(point[1]));
    ctx.beginPath();
    ctx.arc(g2lx(point[0]), g2ly(point[1]), r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
}

function drawPointL(point: number[], r: number, colour?: string): void {
    const dl = layerManager.getLayer(floorStore.currentFloor, "draw");
    if (dl === undefined) return;
    const ctx = dl.ctx;
    ctx.lineJoin = "round";
    ctx.strokeStyle =
        colour === undefined ? `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})` : colour;
    ctx.moveTo(point[0], point[1]);
    ctx.beginPath();
    ctx.arc(point[0], point[1], r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
}

export function drawPolygon(polygon: number[][], colour?: string): void {
    const dl = layerManager.getLayer(floorStore.currentFloor, "draw");
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

function drawPolygonL(polygon: number[][], colour?: string): void {
    const dl = layerManager.getLayer(floorStore.currentFloor, "draw");
    if (dl === undefined) return;
    const ctx = dl.ctx;
    ctx.lineJoin = "round";
    // ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.strokeStyle =
        colour === undefined ? `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})` : colour;
    ctx.moveTo(polygon[0][0], polygon[0][1]);
    for (const point of polygon) {
        ctx.lineTo(point[0], point[1]);
    }
    ctx.closePath();
    ctx.stroke();
}

function x(xx: number, local: boolean): number {
    if (local) return xx;
    else return g2lx(xx);
}

function y(yy: number, local: boolean): number {
    if (local) return yy;
    else return g2ly(yy);
}

let I = 0;
let J = 0;

function drawLine(from: number[], to: number[], constrained: boolean, local: boolean): void {
    // J++;
    // if (constrained) {
    //     I++;
    //     console.log("*", from, to);
    // } else {
    //     console.log(" ", from, to);
    // }
    const dl = layerManager.getLayer(floorStore.currentFloor, "draw");
    if (dl === undefined) return;
    const ctx = dl.ctx;
    ctx.beginPath();
    ctx.strokeStyle = constrained ? "rgba(255, 255, 0, 0.30)" : "rgba(0, 0, 0, 0.30)";
    ctx.moveTo(x(from[0], local), y(from[1], local));
    ctx.lineTo(x(to[0], local), y(to[1], local));
    ctx.closePath();
    ctx.stroke();
}

function drawEdge(edge: Edge, colour: string, local = false): void {
    const from = edge.first!.vertices[edge.second === 0 ? 1 : 0]!.point!;
    const to = edge.first!.vertices[edge.second === 2 ? 1 : 2]!.point!;
    const dl = layerManager.getLayer(floorStore.currentFloor, "draw");
    if (dl === undefined) return;
    const ctx = dl.ctx;
    ctx.beginPath();
    ctx.strokeStyle = colour || "rgba(0, 0, 255, 1)";
    ctx.moveTo(x(from[0], local), y(from[1], local));
    ctx.lineTo(x(to[0], local), y(to[1], local));
    ctx.closePath();
    ctx.stroke();
}

function drawPolygonT(tds: TDS, local = true, clear = true, logs: 0 | 1 | 2 = 0): void {
    I = 0;
    J = 0;
    let T = 0;
    const dl = layerManager.getLayer(floorStore.currentFloor, "draw");
    if (dl === undefined) return;
    const ctx = dl.ctx;
    if (clear) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.lineJoin = "round";
    // ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.lineJoin = "round";
    const ei = new EdgeIterator(tds);
    while (!ei.valid) ei.next();
    do {
        const fromP = ei.edge.first!.vertices[ccw(ei.edge.second)]!.point!;
        const toP = ei.edge.first!.vertices[cw(ei.edge.second)]!.point!;
        if (logs > 0) {
            if (fromP[0] === -Infinity || toP[0] === -Infinity) {
                ei.next();
                continue;
            }
            J++;
            if (ei.edge.first!.constraints[ei.edge.second]) {
                I++;
                if (logs === 2) console.log(`Edge: (*) ${fromP} > ${toP}   (${ei.edge.first!.uid})`);
            } else if (logs === 2) console.log(`Edge: ${fromP} > ${toP}   (${ei.edge.first!.uid})`);
        }
        ei.next();
    } while (ei.valid);
    for (const t of tds.triangles) {
        if (t.isInfinite()) continue;
        T++;
        const po = [];
        ctx.fillStyle = "blue";
        if (t.vertices[0] !== undefined) {
            po.push(t.vertices[0]!.point);
            ctx.beginPath();
            ctx.arc(x(t.vertices[0]!.point![0], local), y(t.vertices[0]!.point![1], local), 5, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
        }
        if (t.vertices[1] !== undefined) {
            po.push(t.vertices[1]!.point);
            ctx.arc(x(t.vertices[1]!.point![0], local), y(t.vertices[1]!.point![1], local), 5, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
        }
        if (t.vertices[2] !== undefined) {
            po.push(t.vertices[2]!.point);
            ctx.arc(x(t.vertices[2]!.point![0], local), y(t.vertices[2]!.point![1], local), 5, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
        }
        if (logs === 2) console.log(`[T ${t.uid}] `, ...po, t.constraints);

        ctx.moveTo(x(t.vertices[0]!.point![0], local), y(t.vertices[0]!.point![1], local));
        if (t.vertices[0] !== undefined && t.vertices[1] !== undefined)
            drawLine(t.vertices[0]!.point!, t.vertices[1]!.point!, t.constraints[2], local);
        if (t.vertices[1] !== undefined && t.vertices[2] !== undefined)
            drawLine(t.vertices[1]!.point!, t.vertices[2]!.point!, t.constraints[0], local);
        if (t.vertices[2] !== undefined && t.vertices[0] !== undefined)
            drawLine(t.vertices[2]!.point!, t.vertices[0]!.point!, t.constraints[1], local);
    }
    if (logs > 0) {
        console.log(`Edges: ${I}/${J}`);
        console.log(`Faces: ${T}`);
    }
}

(window as any).drawPoint = drawPoint;
(window as any).drawPointLocal = drawPointL;
(window as any).drawLine = drawLine;
(window as any).DE = drawEdge;
(window as any).DP = drawPolygon;
(window as any).DPL = drawPolygonL;
(window as any).DPT = drawPolygonT;

// COMMON DEBUG CODE
// (window as any).load = () => {
//     const POINTS = 	[[[2204.40109629713,1502.9370921248671],[2194.4969483467376,1501.8032381745284],[2182.960505429924,849.4588854915166],[2195.2603028653853,848.4339023718949],[2195.2603028653853,1094.4298510811182],[2221.909863975551,1099.554766679227],[2220.8848808559296,1105.7046653969574],[2190.135387267276,1107.7546316362009],[2197.310269104629,1306.6013568428232],[2254.7093238034477,1302.5014243643361],[2255.734306923069,1306.6013568428232],[2193.2103366261417,1314.8012217997973]],
//         [[200,-1350],[200,4350],[750,4350],[750,-1350]],
//         [[3556.1308949025706,368.2067431718624],[3556.1308949025706,4099.326575833981],[4125.828761825174,4099.326575833981],[4125.828761825174,368.2067431718624]]];
//     for (const [i, shape] of (<Polygon[]>layerManager.getLayer(floorStore.currentFloor.name, )!.shapes).entries()) {
//         shape.refPoint = GlobalPoint.fromArray(POINTS[i][0]);
//         shape._vertices = POINTS[i].slice(1).map(p => GlobalPoint.fromArray(p));
//         socket.emit("Shape.Position.Update", { shape: shape.asDict(), redraw: true, temporary: false });
//     }
// }

// (window as any).del = () => {
//     let s = '';
//     for (const triag of PA_CDT.vision.tds.triangles) {
//         s += `${triag.uid}\t${triag.vertices.map(v => v === null ? '0,0' : v.point!.join(",")).join("\t")}\t${triag.neighbours.map(n=>n!.uid).join("\t")}\n`;
//     }
//     console.log(s);
//     deleteShapeFromTriag(TriangulationTarget.VISION, layerManager.getLayer(floorStore.currentFloor.name, )!.shapes[2]);
// }
