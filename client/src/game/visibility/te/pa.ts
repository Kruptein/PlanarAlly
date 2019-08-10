import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";
import { equalPoints } from "@/game/utils";
import { CDT } from "./cdt";
import { Edge, Vertex } from "./tds";
import { ccw, collinearBetween } from "./triag";

export enum TriangulationTarget {
    VISION = "vision",
    MOVEMENT = "movement",
}
import { visibilityStore } from "../store";

export let PA_CDT = {
    vision: new CDT(),
    movement: new CDT(),
};

export function triangulate(target: TriangulationTarget): void {
    console.warn(`RETRIANGULATING ${target}`);
    console.time("TRI");
    const cdt = new CDT();

    let shapes;
    if (target === "vision") shapes = visibilityStore.visionBlockers;
    else shapes = gameStore.movementblockers;

    for (const sh of shapes) {
        const shape = layerManager.UUIDMap.get(sh)!;
        for (let i = 0; i < shape.points.length; i++) {
            const pa = shape.points[i];
            const pb = shape.points[(i + 1) % shape.points.length];
            const { va, vb } = cdt.insertConstraint(pa, pb);
            va.shapes.add(shape);
            vb.shapes.add(shape);
            shape.addTriagVertices(va, vb);
        }
    }
    // console.log(s);
    // LEFT WALL
    cdt.insertConstraint([-1e8, -1e8], [-1e8, 1e8]);
    cdt.insertConstraint([-1e8, 1e8], [-1e11, 1e8]);
    cdt.insertConstraint([-1e11, 1e8], [-1e11, -1e8]);
    cdt.insertConstraint([-1e11, -1e8], [-1e8, -1e8]);
    // TOP WALL
    cdt.insertConstraint([-1e8, -1e8], [1e8, -1e8]);
    cdt.insertConstraint([1e8, -1e8], [1e8, -1e11]);
    cdt.insertConstraint([1e8, -1e11], [-1e8, -1e11]);
    cdt.insertConstraint([-1e8, -1e11], [-1e8, -1e8]);
    // RIGHT WALL
    cdt.insertConstraint([1e8, -1e8], [1e8, 1e8]);
    cdt.insertConstraint([1e8, 1e8], [1e11, 1e8]);
    cdt.insertConstraint([1e11, 1e8], [1e11, -1e8]);
    cdt.insertConstraint([1e11, -1e8], [1e8, -1e8]);
    // BOT WALL
    cdt.insertConstraint([-1e8, 1e8], [1e8, 1e8]);
    cdt.insertConstraint([1e8, 1e8], [1e8, 1e11]);
    cdt.insertConstraint([1e8, 1e11], [-1e8, 1e11]);
    cdt.insertConstraint([-1e8, 1e11], [-1e8, 1e8]);
    PA_CDT[target] = cdt;
    (<any>window).CDT = PA_CDT;
    console.timeEnd("TRI");
}

function deleteIntersectVertex(
    vertex: Vertex,
    from: Vertex,
    target: Vertex,
    queues: { vertices: Set<Vertex>; edges: Edge[]; newConstraints: Vertex[][]; triBridge: Vertex[] },
    isCorner: boolean,
): Vertex {
    const sharesVertex = vertex.shapes.size >= (isCorner ? 2 : 1);
    if (!sharesVertex && !queues.newConstraints.some(nc => nc.includes(vertex))) queues.vertices.add(vertex);
    const edges = [...vertex.getIncidentEdges()].filter(e => e.first!.constraints[e.second]);
    let fixBridge: Vertex[] = [];
    let nextIntersect: Vertex | null = null;
    for (const edge of edges) {
        const ccwv = edge.first!.vertices[ccw(edge.second)]!;
        const ccwp = ccwv.point!;
        const sharesCCWP = ccwv.shapes.size > (ccwv === target ? 1 : 0);
        if (equalPoints(ccwp, target.point!)) {
            if (!sharesCCWP) queues.edges.push(edge);
        } else if (equalPoints(ccwp, from.point!)) continue;
        else if (collinearBetween(vertex.point!, ccwp, target.point!)) {
            if (nextIntersect !== null) console.warn("Multiple collinear vertices found?");
            if (!sharesCCWP) queues.edges.push(edge);
            nextIntersect = ccwv;
        } else if (!sharesCCWP && edges.length === 3) {
            queues.edges.push(edge);
            if (queues.triBridge.length === 0) queues.triBridge.push(isCorner ? ccwv : vertex);
            else queues.newConstraints.push([queues.triBridge.pop()!, isCorner ? ccwv : vertex]);
        } else if (!(sharesVertex && sharesCCWP) && edges.length === 4) {
            queues.edges.push(edge);
            if (queues.vertices.has(ccwv)) {
                for (let i = queues.newConstraints.length - 1; i >= 0; i--) {
                    const [from_, to] = queues.newConstraints[i];
                    if (from_ === vertex || to === vertex) {
                        const brokenBridge = queues.newConstraints.splice(i, 1)[0];
                        fixBridge = [...fixBridge, ...brokenBridge.filter(v => v !== vertex)];
                        queues.vertices.add(vertex);
                    }
                }
            } else if (queues.triBridge.includes(ccwv)) {
                fixBridge.push(queues.triBridge.pop()!);
            } else fixBridge.push(ccwv);
        }
    }
    if ((edges.length === 3 || edges.length === 4) && fixBridge.length === 1 && queues.triBridge.length === 1) {
        queues.newConstraints.push([fixBridge.pop()!, queues.triBridge.pop()!]);
    } else if (edges.length === 4 && fixBridge.length > 0) queues.newConstraints.push(fixBridge);
    if (nextIntersect === null) return vertex;
    return deleteIntersectVertex(nextIntersect, vertex, target, queues, false);
}

export function deleteShapeFromTriag(target: TriangulationTarget, vertices: Vertex[]): void {
    console.time("DS");
    const cdt = PA_CDT[target];
    const queues: { vertices: Set<Vertex>; edges: Edge[]; newConstraints: Vertex[][]; triBridge: Vertex[] } = {
        vertices: new Set(),
        edges: [],
        newConstraints: [],
        triBridge: [],
    };
    const np = vertices.length;
    let from = vertices[np - 1];
    for (const [i, vertex] of vertices.entries()) {
        const n = vertices[(i + 1) % np];
        from = deleteIntersectVertex(vertex, from, n, queues, true);
    }
    // Clear up leftover tribridge from last iteration
    if (queues.triBridge.length > 0) queues.newConstraints.push([queues.triBridge.pop()!, vertices[0]]);

    for (const edge of queues.edges) {
        cdt.removeConstrainedEdgeDelaunay(edge.first!, edge.second);
    }
    for (const vertex of queues.vertices) {
        cdt.removeVertex(vertex);
    }
    for (const [from_, to] of queues.newConstraints) cdt.insertConstraintV(from_, to);
    console.timeEnd("DS");
}

export function addShapeToTriag(_target: TriangulationTarget, _points: number[][]): void {
    return;
    // console.time("AS");
    // const cdt = PA_CDT[target];
    // for (const [i, point] of points.entries()) {
    //     const n = points[(i + 1) % points.length];
    //     cdt.insertConstraint(point, n);
    // }
    // console.timeEnd("AS");
}

export function addShapesToTriag(target: TriangulationTarget, ...shapes: Shape[]): void {
    const cdt = PA_CDT[target];
    for (const shape of shapes) {
        for (const [i, pa] of shape.points.entries()) {
            const pb = shape.points[(i + 1) % shape.points.length];
            const { va, vb } = cdt.insertConstraint(pa, pb);
            va.shapes.add(shape);
            vb.shapes.add(shape);
            shape.addTriagVertices(va, vb);
        }
    }
}
