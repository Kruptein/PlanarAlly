// import earcut from "earcut";
import * as martinez from "martinez-polygon-clipping";
import polygon from "polygon-clipping";
import earcut from "./earcut.js";

import { GlobalPoint, Vector } from "../geom";
import { layerManager } from "../layers/manager";
import { g2lx, g2ly } from "../units";
import { createDCEL, dcel, Edge, Triangle } from "./dcel";
import { drawPolygon } from "./te/draw";

import { CDT } from "./te/cdt";

const cdt = new CDT();
cdt.insertConstraint([50, 50], [50, 100]);
cdt.insertConstraint([50, 100], [250, 100]);
cdt.insertConstraint([250, 100], [250, 50]);
cdt.insertConstraint([250, 50], [50, 50]);

/*
Triangle expansion algorithm
=============================
Based upon https://arxiv.org/pdf/1403.3905.pdf and the CGAL implementation.

The polygon-clipping library returns polygons in CCW order and always adds the first point
as the last point again to form a complete polygon.

The earcut library expects a flat list of vertices followed by a list of indices that points
to the holes in the vertices list.
*/

export function triangulate(shapes: string[], drawt = false) {
    createDCEL();
    if (shapes.length === 0) return dcel;
    console.time("reduce");
    const ringData = reduce(shapes);
    (<any>window).RD = ringData;
    if (drawt) {
        for (const ringshape of ringData.ringshapes) drawPolygon(ringshape);
    }
    console.timeEnd("reduce");
    for (let r = 0; r < ringData.rings.length; r++) {
        const g = generate(ringData.ringshapes[r], ringData.rings[r]);
        triag(g.vertices, g.holes);
    }
}

(<any>window).p = polygon;
(<any>window).m = martinez;

function inside(poly: number[][], ring: number[][]): boolean {
    const intersect = polygon.intersection([poly], [ring]);
    if (intersect.length !== 1 || intersect[0].length !== 1) return false;
    // for (const point of intersect[0][0]) {
    //     const eq = (p: number[]) => p[0] === point[0] && p[1] === point[1];
    //     if (!poly.some(eq) && !ring.some(eq)) return false;
    // }
    return true;
}

function matchingXors(xors: number[][][][], poly: number[][]) {
    const matches = [];
    for (const xorE of xors) {
        // If 2 points are found matching, it is a ring
        // otherwise its an inner block cross-section
        let pointFound = false;
        for (const xorP of xorE[0]) {
            if (poly.some(p => p[0] === xorP[0] && p[1] === xorP[1])) {
                if (pointFound) {
                    matches.push(xorE);
                    break;
                } else {
                    pointFound = true;
                }
            }
        }
    }
    return matches;
}

function reduce(shapes: string[]) {
    const world = [[1e10, 1e10], [-1e10, 1e10], [-1e10, -1e10], [1e10, -1e10]];
    const ringshapes: number[][][] = [world];
    const rings: number[][][][] = [[]];
    const queue: [number[][], number[]][] = [];
    for (const shape of shapes) {
        const p = layerManager.UUIDMap.get(shape)!.points;
        if (p.length === 0) continue;
        queue.push([p.reverse(), []]);
    }
    while (queue.length > 0) {
        try {
            const drctx = layerManager.getLayer("draw")!.ctx;
            drctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        } catch {}
        const [q, ringHint] = queue.shift()!;
        drawPolygon(q, "red");
        for (let r = rings.length - 1; r >= 0; r--) {
            if (ringHint.length > 0 && !ringHint.includes(r)) continue;
            if (!inside(q, ringshapes[r])) continue;
            // Check if it further expands the inner boundary
            const xor = polygon.xor([q], [ringshapes[r]]);

            if (xor.length === 1) {
                // touching
                if (xor[0].length === 1) {
                    ringshapes[r] = xor[0][0];
                    continue;
                    // one shape is inside the other
                } else {
                }
                // overlapping
            } else if (xor.length === 2) {
                ringshapes[r] = matchingXors(xor, ringshapes[r])[0][0];
                // it's possible for shapes in the ring now to be part of the ring
                // todo: look into not continue'ing in this case but continuing merge detection below.
                for (const ro of rings[r]) queue.unshift([ro, [r]]);
                rings[r] = [];
                continue;
            } else if (xor.length > 2) {
                // queue.push(...rings[r]);
                const hints = [r];
                const ringshape = ringshapes[r];
                ringshapes.splice(r, 1);
                const oldRingData = rings.splice(r, 1);
                for (const match of matchingXors(xor, ringshape)) {
                    ringshapes.push(match[0]);
                    rings.push([]);
                    hints.push(rings.length - 1);
                }
                for (const ro of oldRingData[0]) queue.unshift([ro, hints]);
                continue;
            }

            if (rings[r].length === 0) {
                rings[r].push(q);
                break;
            }
            let result = q;
            let ringMerge = false;
            for (let re = rings[r].length - 1; re >= 0; re--) {
                const ringEl = rings[r][re];
                const union = polygon.union([result], [ringEl]);
                // no overlap
                if (union.length === 2) {
                    continue;
                    // merge does not create ring
                } else if (union.length === 1 && union[0].length === 1) {
                    rings[r].splice(re, 1);
                    result = union[0][0];
                    // merge creates ring
                } else if (union.length === 1 && union[0].length === 2) {
                    ringMerge = true;
                    rings[r].splice(re, 1);
                    ringshapes.push(union[0][1].reverse());
                    rings.push([]);
                    // queue.push(...rings[r]);
                    for (const ro of rings[r]) {
                        queue.unshift([ro, [r, rings.length - 1]]);
                    }
                    rings[r] = [union[0][0]];
                    break;
                } else {
                    console.log(union);
                    console.error("Check dit");
                }
            }
            if (!ringMerge) rings[r].push(result);
            break;
        }
    }
    return { ringshapes, rings };
}

function generate(boundary: number[][], shapes: number[][][]) {
    const vertices: number[] = boundary.reduce((acc, val) => acc.concat(val));
    const end = vertices.length;
    if (vertices[0] === vertices[end - 2] && vertices[1] === vertices[end - 1]) vertices.splice(0, 2);
    const holes = [];
    for (const shape of shapes) {
        holes.push(vertices.length / 2);
        for (const [idx, point] of shape.reverse().entries()) {
            if (idx > 0 && point[0] === shape[0][0] && point[1] === shape[0][1]) continue;
            vertices.push(point[0], point[1]);
        }
    }
    return { vertices, holes };
}

function triag(vertices: number[], holes: number[]) {
    const start = dcel.vertices.length / 2;
    dcel.vertices.push(...vertices);
    const triangles = earcut(vertices, holes);
    for (let t = 0; t < triangles.length; t += 3) {
        dcel.add_edge(new Edge(start + triangles[t], start + triangles[t + 1]));
        dcel.add_edge(new Edge(start + triangles[t + 1], start + triangles[t + 2]));
        dcel.add_edge(new Edge(start + triangles[t + 2], start + triangles[t]));
        const tl = dcel.edges.length;
        dcel.add_triangle(new Triangle([tl - 3, tl - 2, tl - 1]));
    }
    // draw();
    dcel.checkConstraints(start, dcel.vertices.length / 2, holes);

    return dcel;
}

function draw() {
    const ctx = layerManager.getLayer("draw")!.ctx;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineJoin = "round";
    for (const triangle of dcel.triangles) {
        ctx.moveTo(g2lx(triangle.vertex(0)[0]), g2ly(triangle.vertex(0)[1]));
        ctx.lineTo(g2lx(triangle.vertex(1)[0]), g2ly(triangle.vertex(1)[1]));
        ctx.lineTo(g2lx(triangle.vertex(2)[0]), g2ly(triangle.vertex(2)[1]));
        ctx.lineTo(g2lx(triangle.vertex(0)[0]), g2ly(triangle.vertex(0)[1]));
    }

    for (let i = 0; i < dcel.vertices.length; i += 2) {
        ctx.fillText(`${i / 2}`, g2lx(dcel.vertices[i]), g2ly(dcel.vertices[i + 1]));
    }

    ctx.closePath();
    ctx.stroke();
}

export function computeVisibility(q: GlobalPoint, it = 0, drawt = true): number[][] {
    // console.time("CV");
    const rawOutput: number[][] = [];
    const triangle = dcel.locate(q);
    if (triangle === undefined) {
        if (it > 10) {
            console.error("Triangle not found");
            return [];
        }
        return computeVisibility(q.add(new Vector(0.001, 0.001)), ++it);
    }
    // triangle.fill();
    for (const [index, edge] of triangle.getEdges().entries()) {
        rawOutput.push(edge.fromVertex);
        if (!edge.constrained) expandEdge(q, edge.fromVertex, edge.toVertex, triangle, index, rawOutput);
    }
    // console.timeEnd("CV");

    if (drawt) drawPolygon(rawOutput, "red");

    return rawOutput;
}

function expandEdge(
    q: GlobalPoint,
    left: number[],
    right: number[],
    fh: Triangle,
    index: number,
    rawOutput: number[][],
): void {
    // fh.edge(index).draw();
    const nfh = fh.neighbour(index);
    // nfh.fill("rgba(255, 0, 0, 0.25)");
    const nIndex = nfh.index(fh.edge(index).opposite);
    const lIndex = nfh.cw(nIndex);
    const rIndex = nfh.ccw(nIndex);
    const nvh = nfh.vertex(nIndex);
    const lvh = nfh.vertex(rIndex);
    const rvh = nfh.vertex(lIndex);

    const le = nfh.edge(lIndex);
    const re = nfh.edge(rIndex);

    const lo = orientation(q, left, nvh);
    const ro = orientation(q, right, nvh);

    // const ctx = layerManager.getLayer("draw")!.ctx;
    // ctx.beginPath();
    // ctx.strokeStyle = "red";
    // ctx.lineJoin = "round";
    // ctx.moveTo(g2lx(q.x), g2ly(q.y));
    // ctx.lineTo(g2lx(left[0]), g2ly(left[1]));
    // ctx.moveTo(g2lx(q.x), g2ly(q.y));
    // ctx.lineTo(g2lx(nvh[0]), g2ly(nvh[1]));
    // ctx.strokeStyle = "blue";
    // ctx.moveTo(g2lx(q.x), g2ly(q.y));
    // ctx.lineTo(g2lx(right[0]), g2ly(right[1]));
    // ctx.moveTo(g2lx(q.x), g2ly(q.y));
    // ctx.lineTo(g2lx(nvh[0]), g2ly(nvh[1]));
    // ctx.closePath();
    // ctx.stroke();

    if (lo < 0) {
        if (le.constrained) {
            if (left[0] !== lvh[0] || left[1] !== lvh[1]) {
                rawOutput.push(raySegIntersection(q, left, nvh, lvh));
            }
            if (ro < 0) {
                rawOutput.push(raySegIntersection(q, right, nvh, lvh));
            }
            // return;
        } else {
            if (ro < 0) {
                return expandEdge(q, left, right, nfh, lIndex, rawOutput);
            } else {
                expandEdge(q, left, nvh, nfh, lIndex, rawOutput);
            }
        }
    }

    if (ro >= 0 && lo <= 0) {
        rawOutput.push(nvh);
    }

    // Right edge is seen if the new vertex is ccw of the right ray
    if (ro > 0) {
        if (re.constrained) {
            if (lo > 0) {
                rawOutput.push(raySegIntersection(q, left, nvh, rvh));
            }
            // See if current right ray is rvh
            if (right[0] !== rvh[0] || right[1] !== rvh[1]) {
                rawOutput.push(raySegIntersection(q, right, nvh, rvh));
            }
            return;
        } else {
            if (lo > 0) {
                return expandEdge(q, left, right, nfh, rIndex, rawOutput);
            } else {
                return expandEdge(q, nvh, right, nfh, rIndex, rawOutput);
            }
        }
    }
}

function raySegIntersection(q: GlobalPoint, b: number[], s: number[], t: number[]) {
    const denominator = (t[1] - s[1]) * (b[0] - q.x) - (t[0] - s[0]) * (b[1] - q.y);
    const ua = ((t[0] - s[0]) * (q.y - s[1]) - (t[1] - s[1]) * (q.x - s[0])) / denominator;
    // const ub = ((b[0] - q.x) * (q.y - s[1]) - (b[1] - q.y) * (q.x - s[0])) / denominator;
    const x = q.x + ua * (b[0] - q.x);
    const y = q.y + ua * (b[1] - q.y);

    return [x, y];
}

// // ~Shoelace formula
// // > 0 CCW    < 0 CW
// function orientation(point: GlobalPoint, from: number[], to: number[]) {
//     return (
//         point.x * from[1] + from[0] * to[1] + to[0] * point.y - from[0] * point.y - to[0] * from[1] - point.x * to[1]
//     );
// }

// > 0 CCW    < 0 CW
function orientation(a: GlobalPoint, b: number[], c: number[]) {
    const dAx = b[0] - a.x;
    const dAy = b[1] - a.y;
    const dBx = c[0] - a.x;
    const dBy = c[1] - a.y;
    return -Math.atan2(dAx * dBy - dAy * dBx, dAx * dBx + dAy * dBy);
}

(<any>window).D = draw;
(<any>window).G = generate;
(<any>window).E = earcut;
(<any>window).T = triangulate;
(<any>window).CV = computeVisibility;
