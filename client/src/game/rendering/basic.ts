import { g2lx, g2ly, toRadians } from "../../core/conversions";
import { toArrayP } from "../../core/geometry";
import type { LocalPoint, Ray } from "../../core/geometry";
import { LayerName } from "../models/floor";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { EdgeIterator } from "../vision/tds";
import type { Edge, TDS } from "../vision/tds";
import { ccw, cw } from "../vision/triag";

// eslint-disable-next-line import/no-unused-modules
export function drawPoint(point: [number, number], r: number, options?: { colour?: string; fill?: boolean }): void {
    const dl = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
    if (dl === undefined) return;
    const ctx = dl.ctx;
    ctx.lineJoin = "round";
    ctx.strokeStyle =
        options?.colour === undefined
            ? `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
            : options.colour;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.moveTo(g2lx(point[0]), g2ly(point[1]));
    ctx.beginPath();
    ctx.arc(g2lx(point[0]), g2ly(point[1]), r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
    if (options?.fill === true) ctx.fill();
}

// eslint-disable-next-line import/no-unused-modules
function drawPointL(point: [number, number], r: number, colour?: string): void {
    const dl = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
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

// eslint-disable-next-line import/no-unused-modules
export function drawPolygon(
    polygon: [number, number][],
    options?: {
        fillColour?: string;
        strokeColour?: string;
        strokeWidth?: number;
        close?: boolean;
        debug?: boolean;
    },
): void {
    if (polygon.length === 0) return;

    const dl = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
    if (dl === undefined) return;
    const ctx = dl.ctx;
    ctx.lineJoin = "round";
    // ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.lineJoin = "round";
    ctx.beginPath();

    let performStroke = options?.strokeColour !== undefined;
    if (options?.strokeColour === undefined && options?.fillColour === undefined) {
        ctx.strokeStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
        performStroke = true;
    }
    if (options?.strokeColour !== undefined) ctx.strokeStyle = options.strokeColour;
    if (options?.fillColour !== undefined) ctx.fillStyle = options.fillColour;

    const x = g2lx(polygon[0]![0]);
    const y = g2ly(polygon[0]![1]);
    ctx.moveTo(x, y);
    if (options?.debug ?? false) console.log(x, y);
    for (const point of polygon) {
        const x = g2lx(point[0]);
        const y = g2ly(point[1]);
        ctx.lineTo(x, y);
        if (options?.debug ?? false) console.log(x, y);
    }
    if (options?.close ?? true) ctx.closePath();
    if (performStroke) {
        if (options?.strokeWidth !== undefined) ctx.lineWidth = options.strokeWidth;
        ctx.stroke();
    }
    if (options?.fillColour !== undefined) ctx.fill();
}

// eslint-disable-next-line import/no-unused-modules
export function drawPolygonL(polygon: [number, number][], colour?: string): void {
    if (polygon.length === 0) return;

    const dl = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
    if (dl === undefined) return;
    const ctx = dl.ctx;
    ctx.lineJoin = "round";
    // ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.fillStyle =
        colour === undefined ? `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})` : colour;
    ctx.moveTo(polygon[0]![0], polygon[0]![1]);
    for (const point of polygon) {
        ctx.lineTo(point[0], point[1]);
    }
    ctx.closePath();
    ctx.fill();
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

// eslint-disable-next-line import/no-unused-modules
export function drawLine(
    from: [number, number],
    to: [number, number],
    local: boolean,
    options?: { constrained?: boolean; lineWidth?: number; strokeStyle?: string },
): void {
    const constrained = options?.constrained ?? false;
    // J++;
    // if (constrained) {
    //     I++;
    //     console.log("*", from, to);
    // } else {
    //     console.log(" ", from, to);
    // }
    const dl = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
    if (dl === undefined) return;
    const ctx = dl.ctx;
    if (options?.lineWidth !== undefined) ctx.lineWidth = options.lineWidth;
    ctx.beginPath();
    if (options?.strokeStyle !== undefined) ctx.strokeStyle = options.strokeStyle;
    else ctx.strokeStyle = constrained ? "rgba(255, 255, 0, 0.30)" : "rgba(0, 0, 0, 0.30)";
    ctx.moveTo(x(from[0], local), y(from[1], local));
    ctx.lineTo(x(to[0], local), y(to[1], local));
    ctx.closePath();
    ctx.stroke();
}

// eslint-disable-next-line import/no-unused-modules
export function drawTear(ray: Ray<LocalPoint>, options?: { fillColour?: string }): void {
    const dl = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
    if (dl === undefined) return;
    const ctx = dl.ctx;

    // const ray = Ray.fromPoints(toLP(120, 20), toLP(175, 100));
    // const ray = Ray.fromPoints(toLP(120, 20), toLP(120, 88));
    const angleRay = ray.direction.angle();
    const a = toArrayP(ray.get(0));
    const b = toArrayP(ray.getPointAtDistance(68));

    const r = 34.5;
    const angleA = angleRay - Math.PI / 2 - toRadians(30);
    const angleB = angleA + Math.PI + toRadians(60);
    const c = [b[0] + r * Math.cos(angleA), b[1] + r * Math.sin(angleA)] as [number, number];

    ctx.beginPath();
    ctx.lineJoin = "miter";
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(c[0], c[1]);
    ctx.arc(b[0], b[1], r, angleA, angleB, false);
    ctx.lineTo(a[0], a[1]);
    ctx.closePath();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fillStyle = options?.fillColour ?? "#77CCEE";
    ctx.stroke();
    ctx.fill();

    // drawPointL([117.5, 30], 5, "red");
    // drawPointL([117.5, 35], 5, "orange");
    // drawPointL(a, 5, "blue");
    // drawPointL(b, 5, "brown");
    // drawPointL(c, 5, "green");
}

// eslint-disable-next-line import/no-unused-modules
function drawEdge(edge: Edge, colour: string, local = false): void {
    const from = edge.first!.vertices[edge.second === 0 ? 1 : 0]!.point as [number, number];
    const to = edge.first!.vertices[edge.second === 2 ? 1 : 2]!.point as [number, number];
    const dl = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
    if (dl === undefined) return;
    const ctx = dl.ctx;
    ctx.beginPath();
    ctx.strokeStyle = colour || "rgba(0, 0, 255, 1)";
    ctx.moveTo(x(from[0], local), y(from[1], local));
    ctx.lineTo(x(to[0], local), y(to[1], local));
    ctx.closePath();
    ctx.stroke();
}

// eslint-disable-next-line import/no-unused-modules
export function drawPolygonT(tds: TDS, local = true, clear = true, logs: 0 | 1 | 2 = 0): void {
    I = 0;
    J = 0;
    let T = 0;
    const dl = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw);
    if (dl === undefined) return;
    const ctx = dl.ctx;
    if (clear) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.lineJoin = "round";
    // ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.lineJoin = "round";
    const ei = new EdgeIterator(tds);
    while (!ei.valid) ei.next();
    do {
        const fromP = ei.edge.first!.vertices[ccw(ei.edge.second)]!.point as [number, number];
        const toP = ei.edge.first!.vertices[cw(ei.edge.second)]!.point as [number, number];
        if (logs > 0) {
            if (fromP[0] === -Infinity || toP[0] === -Infinity) {
                ei.next();
                continue;
            }
            J++;
            if (ei.edge.first!.constraints[ei.edge.second] === true) {
                I++;
                if (logs === 2)
                    console.log(`Edge: (*) ${fromP.toString()} > ${toP.toString()}   (${ei.edge.first!.uid})`);
            } else if (logs === 2)
                console.log(`Edge: ${fromP.toString()} > ${toP.toString()}   (${ei.edge.first!.uid})`);
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
            drawLine(t.vertices[0]!.point as [number, number], t.vertices[1]!.point as [number, number], local, {
                constrained: t.constraints[2],
            });
        if (t.vertices[1] !== undefined && t.vertices[2] !== undefined)
            drawLine(t.vertices[1]!.point as [number, number], t.vertices[2]!.point as [number, number], local, {
                constrained: t.constraints[0],
            });
        if (t.vertices[2] !== undefined && t.vertices[0] !== undefined)
            drawLine(t.vertices[2]!.point as [number, number], t.vertices[0]!.point as [number, number], local, {
                constrained: t.constraints[1],
            });
    }
    if (logs > 0) {
        console.log(`Edges: ${I}/${J}`);
        console.log(`Faces: ${T}`);
    }
}

export function polygon2path(points: [number, number][]): Path2D {
    const path = new Path2D();
    path.moveTo(g2lx(points[0]![0]), g2ly(points[0]![1]));
    for (const point of points) path.lineTo(g2lx(point[0]), g2ly(point[1]));
    path.closePath();
    return path;
}

function showLayerPoints(): void {
    const layer = floorState.currentLayer.value!;
    const dL = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw)!;
    dL.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const point of layer.points.keys()) {
        const parsedPoint = JSON.parse(point) as [number, number];
        dL.ctx.beginPath();
        dL.ctx.arc(g2lx(parsedPoint[0]), g2ly(parsedPoint[1]), 5, 0, 2 * Math.PI);
        dL.ctx.fill();
    }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).drawPoint = drawPoint;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).drawPointLocal = drawPointL;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).drawLine = drawLine;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).DE = drawEdge;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).DP = drawPolygon;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).DPL = drawPolygonL;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).DPT = drawPolygonT;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).showLayerPoints = showLayerPoints;

// COMMON DEBUG CODE
// (window as any).load = () => {
//     const POINTS = 	[[[2204.40109629713,1502.9370921248671],[2194.4969483467376,1501.8032381745284],[2182.960505429924,849.4588854915166],[2195.2603028653853,848.4339023718949],[2195.2603028653853,1094.4298510811182],[2221.909863975551,1099.554766679227],[2220.8848808559296,1105.7046653969574],[2190.135387267276,1107.7546316362009],[2197.310269104629,1306.6013568428232],[2254.7093238034477,1302.5014243643361],[2255.734306923069,1306.6013568428232],[2193.2103366261417,1314.8012217997973]],
//         [[200,-1350],[200,4350],[750,4350],[750,-1350]],
//         [[3556.1308949025706,368.2067431718624],[3556.1308949025706,4099.326575833981],[4125.828761825174,4099.326575833981],[4125.828761825174,368.2067431718624]]];
//     for (const [i, shape] of (<Polygon[]>floorSystem.getLayer(floorState.currentFloor.name, )!.shapes).entries()) {
//         shape.refPoint = toGP(POINTS[i][0]);
//         shape._vertices = POINTS[i].slice(1).map(p => toGP(p));
//         socket.emit("Shape.Position.Update", { shape: shape.asDict(), redraw: true, temporary: false });
//     }
// }

// (window as any).del = () => {
//     let s = '';
//     for (const triag of PA_CDT.vision.tds.triangles) {
//         s += `${triag.uid}\t${triag.vertices.map(v => v === null ? '0,0' : v.point!.join(",")).join("\t")}\t${triag.neighbours.map(n=>n!.uid).join("\t")}\n`;
//     }
//     console.log(s);
//     deleteShapeFromTriag(TriangulationTarget.VISION, floorSystem.getLayer(floorState.currentFloor.name, )!.shapes[2]);
// }
