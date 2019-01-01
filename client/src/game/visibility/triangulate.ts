// import earcut from "earcut";
import polygon from "polygon-clipping";
import earcut from "./earcut.js";

import { GlobalPoint, Vector } from "../geom";
import { layerManager } from "../layers/manager";
import { g2lx, g2ly } from "../units";
import { cdel, CDEL, createCDEL, Edge, Triangle } from "./cdel";

/*
Triangle expansion algorithm
=============================
Based upon https://arxiv.org/pdf/1403.3905.pdf and the CGAL implementation.

The polygon-clipping library returns polygons in CCW order and always adds the first point
as the last point again to form a complete polygon.

The earcut library expects a flat list of vertices followed by a list of indices that points
to the holes in the vertices list.
*/

export function triangulate(shapes: string[]) {
    if (shapes.length === 0) return new CDEL([]);
    const sh = reduce(shapes);
    const g = generate(sh);
    return triag(g.vertices, g.holes, sh);
}

(<any>window).p = polygon;

function reduce(shapes: string[]) {
    // const reduced: number[][] = [];
    // for (const shapeId of shapes) {
    //     const shape = layerManager.UUIDMap.get(shapeId)!;
    //     for (let i = reduced.length - 1; i >= 0; i--) {
    //         const un = polygon.union([reduced[i]], shape.points);
    //         if (un.length === 1) {
    //             reduced[i] =
    //         }
    //     }
    // }
    const points: number[][][][] = [];
    for (const shape of shapes) {
        const p = layerManager.UUIDMap.get(shape)!.points;
        if (p.length > 0) points.push([p]);
    }
    return polygon.union(...points);
}

function generate(shapes: number[][][][]) {
    const vertices = [0, 0, 0, 0, 0, 0, 0, 0];
    let minX = 0;
    let minY = 0;
    let maxX = 0;
    let maxY = 0;
    const holes = [];
    for (const shape of shapes) {
        holes.push(vertices.length / 2);
        for (const sha of shape) {
            for (const [idx, point] of sha.reverse().entries()) {
                if (idx === shape[0].length - 1) continue;
                vertices.push(point[0], point[1]);

                if (minX > point[0]) minX = point[0];
                if (minY > point[1]) minY = point[1];
                if (maxX < point[0]) maxX = point[0];
                if (maxY < point[1]) maxY = point[1];
            }
        }
    }
    minX -= 1e6;
    minY -= 1e6;
    maxX += 1e6;
    maxY += 1e6;
    vertices.splice(0, 8, minX, minY, maxX, minY, maxX, maxY, minX, maxY);
    return { vertices, holes };
}

function triag(vertices: number[], holes: number[], shapes: number[][][][]) {
    createCDEL(vertices, holes);
    const triangles = earcut(vertices, holes);
    for (let t = 0; t < triangles.length; t += 3) {
        cdel.add_edge(new Edge(triangles[t], triangles[t + 1]));
        cdel.add_edge(new Edge(triangles[t + 1], triangles[t + 2]));
        cdel.add_edge(new Edge(triangles[t + 2], triangles[t]));
        const tl = cdel.edges.length;
        cdel.add_triangle(new Triangle([tl - 3, tl - 2, tl - 1]));
    }
    draw();
    // cdel.checkConstraints();
    return cdel;
}

function draw() {
    const ctx = layerManager.getLayer("draw")!.ctx;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineJoin = "round";
    for (const triangle of cdel.triangles) {
        ctx.moveTo(g2lx(triangle.vertex(0)[0]), g2ly(triangle.vertex(0)[1]));
        ctx.lineTo(g2lx(triangle.vertex(1)[0]), g2ly(triangle.vertex(1)[1]));
        ctx.lineTo(g2lx(triangle.vertex(2)[0]), g2ly(triangle.vertex(2)[1]));
        ctx.lineTo(g2lx(triangle.vertex(0)[0]), g2ly(triangle.vertex(0)[1]));
    }

    for (let i = 0; i < cdel.vertices.length; i += 2) {
        ctx.fillText(`${i / 2}`, g2lx(cdel.vertices[i]), g2ly(cdel.vertices[i + 1]));
    }

    ctx.closePath();
    ctx.stroke();
}

export function computeVisibility(q: GlobalPoint, it = 0): number[][] {
    const rawOutput: number[][] = [];
    const triangle = cdel.locate(q);
    if (triangle === undefined) {
        if (it > 10) {
            console.error("Triangle not found");
            return [];
        }
        return computeVisibility(q.add(new Vector(0.001, 0.001)), it++);
    }
    // triangle.fill();
    for (const [index, edge] of triangle.getEdges().entries()) {
        rawOutput.push(edge.fromVertex);
        if (!edge.constrained) expandEdge(q, edge.fromVertex, edge.toVertex, triangle, index, rawOutput);
    }

    // const outArr = output(rawOutput);

    // const ctx = layerManager.getLayer("draw")!.ctx;
    // // ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    // ctx.beginPath();
    // ctx.strokeStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
    // ctx.lineJoin = "round";
    // ctx.moveTo(g2lx(rawOutput[0][0]), g2ly(rawOutput[0][1]));
    // for (const point of rawOutput.slice(1)) {
    //     ctx.lineTo(g2lx(point[0]), g2ly(point[1]));
    // }
    // ctx.closePath();
    // ctx.stroke();

    // return outArr;
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
