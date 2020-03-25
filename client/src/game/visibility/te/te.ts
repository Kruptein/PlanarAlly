import { GlobalPoint } from "@/game/geom";
import { gameStore } from "@/game/store";
import { Edge } from "./cdt";
import { drawPolygon } from "./draw";
import { getCDT, TriangulationTarget } from "./pa";
import { Point, Sign, Triangle } from "./tds";
import { ccw, cw, orientation } from "./triag";

export function computeVisibility(
    q: GlobalPoint,
    target: TriangulationTarget,
    floor: string,
    drawt?: boolean,
): number[][] {
    if (drawt === undefined) drawt = gameStore.drawTEContour;
    // console.time("CV");
    const Q: Point = [q.x, q.y];
    const rawOutput: number[][] = [];
    const triangle = getCDT(target, floor).locate(Q, null).loc;
    if (triangle === null) {
        console.error("Triangle not found");
        return [];
    }
    // triangle.fill();
    rawOutput.push(triangle.vertices[1]!.point!);
    if (!triangle.isConstrained(0))
        expandEdge(Q, triangle.vertices[2]!.point!, triangle.vertices[1]!.point!, triangle, 0, rawOutput);
    rawOutput.push(triangle.vertices[2]!.point!);
    if (!triangle.isConstrained(1))
        expandEdge(Q, triangle.vertices[0]!.point!, triangle.vertices[2]!.point!, triangle, 1, rawOutput);
    rawOutput.push(triangle.vertices[0]!.point!);
    if (!triangle.isConstrained(2))
        expandEdge(Q, triangle.vertices[1]!.point!, triangle.vertices[0]!.point!, triangle, 2, rawOutput);
    // console.timeEnd("CV");

    if (drawt) drawPolygon(rawOutput, "red");

    return rawOutput;
}

function expandEdge(
    q: Point,
    left: number[],
    right: number[],
    fh: Triangle,
    index: number,
    rawOutput: number[][],
): void {
    // fh.edge(index).draw();
    const nfh = fh.neighbours[index]!;
    // nfh.fill("rgba(255, 0, 0, 0.25)");
    const nIndex = nfh.indexT(fh);
    const rIndex = ccw(nIndex);
    const lIndex = cw(nIndex);
    const nvh = nfh.vertices[nIndex]!;
    const rvh = nfh.vertices[lIndex]!;
    const lvh = nfh.vertices[rIndex]!;

    const re: Edge = [nfh, rIndex];
    const le: Edge = [nfh, lIndex];

    const ro = orientation(q, right, nvh.point!);
    const lo = orientation(q, left, nvh.point!);

    // const ctx = layerManager.getLayer(layerManager.floor!.name, "draw")!.ctx;
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

    // Right edge is seen if the new vertex is ccw of the right ray
    if (ro === Sign.COUNTERCLOCKWISE) {
        if (re[0].isConstrained(re[1])) {
            // See if current right ray is rvh
            if (right !== rvh.point!) rawOutput.push(raySegIntersection(q, right, nvh.point!, rvh.point!));
            if (lo === Sign.COUNTERCLOCKWISE) rawOutput.push(raySegIntersection(q, left, nvh.point!, rvh.point!));
        } else {
            if (lo === Sign.COUNTERCLOCKWISE) return expandEdge(q, left, right, nfh, rIndex, rawOutput);
            else expandEdge(q, nvh.point!, right, nfh, rIndex, rawOutput);
        }
    }

    if (ro !== Sign.CLOCKWISE && lo !== Sign.COUNTERCLOCKWISE) {
        rawOutput.push(nvh.point!);
    }

    if (lo === Sign.CLOCKWISE) {
        if (le[0].isConstrained(le[1])) {
            if (ro === Sign.CLOCKWISE) {
                rawOutput.push(raySegIntersection(q, right, nvh.point!, lvh.point!));
            }
            if (left !== lvh.point!) {
                rawOutput.push(raySegIntersection(q, left, nvh.point!, lvh.point!));
            }
            return;
        } else {
            if (ro === Sign.CLOCKWISE) {
                return expandEdge(q, left, right, nfh, lIndex, rawOutput);
            } else {
                return expandEdge(q, left, nvh.point!, nfh, lIndex, rawOutput);
            }
        }
    }
}

function raySegIntersection(q: Point, b: Point, s: Point, t: Point): Point {
    const denominator = (t[1] - s[1]) * (b[0] - q[0]) - (t[0] - s[0]) * (b[1] - q[1]);
    const ua = ((t[0] - s[0]) * (q[1] - s[1]) - (t[1] - s[1]) * (q[0] - s[0])) / denominator;
    // const ub = ((b[0] - q.x) * (q.y - s[1]) - (b[1] - q.y) * (q.x - s[0])) / denominator;
    const x = q[0] + ua * (b[0] - q[0]);
    const y = q[1] + ua * (b[1] - q[1]);

    return [x, y];
}
