import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { equalPoints } from '@/game/utils';
import { CDT } from "./cdt";
import { Edge, Vertex } from './tds';
import { ccw, collinearBetween } from './triag';


export enum TriangulationTarget {
    VISION = "vision",
    MOVEMENT = "movement"
}


export let PA_CDT = {
    "vision": new CDT(),
    "movement": new CDT(),
};

export let POINT_VERTEX_MAP: {[key: string]: Vertex} = {};

export function triangulate(target: TriangulationTarget) {
    console.warn(`RETRIANGULATING ${target}`);
    console.time("TRI");
    const cdt = new CDT();

    let shapes;
    if (target === "vision") shapes = gameStore.visionBlockers;
    else shapes = gameStore.movementblockers;

    for (const sh of shapes) {
        const shape = layerManager.UUIDMap.get(sh)!;
        for (let i = 0; i < shape.points.length; i++) {
            const pa = shape.points[i];
            const pb = shape.points[(i + 1) % shape.points.length];
            const {va, vb} = cdt.insertConstraint(pa, pb);
            if (POINT_VERTEX_MAP[`${pa[0]}:${pa[1]}`] === undefined) POINT_VERTEX_MAP[`${pa[0]}:${pa[1]}`] = va;
            if (POINT_VERTEX_MAP[`${pb[0]}:${pb[1]}`] === undefined) POINT_VERTEX_MAP[`${pb[0]}:${pb[1]}`] = vb;
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
    (<any>window).PVM = POINT_VERTEX_MAP;
    console.timeEnd("TRI");
}

function deleteIntersectVertex(vertex: Vertex, from: number[], target: number[], queues: {vertices: Set<Vertex>; edges: Edge[], newConstraints: Vertex[][], triBridge: Vertex[]}): number[] {
    queues.vertices.add(vertex);
    const edges = [...vertex.getIncidentEdges()].filter(e => e.first!.constraints[e.second]);
    let fixBridge: Vertex[] = [];
    let nextIntersect: Vertex | null = null;
    for (const edge of edges) {
        const ccwv = edge.first!.vertices[ccw(edge.second)]!;
        const ccwp = ccwv.point!;
        if (equalPoints(ccwp, target)) queues.edges.push(edge);
        else if(equalPoints(ccwp, from)) continue;
        else if (collinearBetween(vertex.point!, ccwp, target)) {
            if (nextIntersect !== null) console.warn("Multiple collinear vertices found?");
            queues.edges.push(edge);
            nextIntersect = ccwv;
        } else if (edges.length === 3) {
            queues.edges.push(edge);
            if (queues.triBridge.length === 0) queues.triBridge.push(ccwv);
            else queues.newConstraints.push([queues.triBridge.pop()!, ccwv])
        } else if (edges.length === 4) {
            queues.edges.push(edge);
            if (queues.vertices.has(ccwv)) {
                for (let i=queues.newConstraints.length - 1; i >= 0; i--) {
                    const [from_, to] = queues.newConstraints[i];
                    if (from_ === vertex || to === vertex) {
                        const brokenBridge = queues.newConstraints.splice(i, 1)[0];
                        fixBridge = [...fixBridge, ...brokenBridge.filter(v => v !== vertex)];
                    }
                }
            } else fixBridge.push(ccwv);
        } else if (edges.length !== 2) {
            console.warn(":pikachu:");
            console.log(edges.length);
        }
    }
    if (edges.length === 4) queues.newConstraints.push(fixBridge);
    if (nextIntersect === null) return vertex.point!;
    return deleteIntersectVertex(nextIntersect, vertex.point!, target, queues);
}

export function deleteShapeFromTriag(target: TriangulationTarget, points: number[][]) {
    console.time("DS");
    const cdt = PA_CDT[target];
    const queues: {vertices: Set<Vertex>; edges: Edge[], newConstraints: Vertex[][], triBridge: Vertex[]} = {vertices: new Set(), edges: [], newConstraints: [], triBridge: []};
    const np = points.length;
    let from = points[np - 1];
    for (const [i, point] of points.entries()) {
        const n = points[(i + 1) % np];
        const vertex = cdt.tds.vertices.find(v => equalPoints(v.point!, point))!;
        from = deleteIntersectVertex(vertex, from, n, queues);
    }
    for (const edge of queues.edges) {
        cdt.removeConstrainedEdgeDelaunay(edge.first!, edge.second);
    }
    for (const vertex of queues.vertices) {
        cdt.removeVertex(vertex);
    }
    for (const [from_, to] of queues.newConstraints) cdt.insertConstraintV(from_, to);
    console.timeEnd("DS");
}

export function addShapeToTriag(target: TriangulationTarget, points: number[][]) {
    console.time("AS");
    const cdt = PA_CDT[target];
    for (const [i, point] of points.entries()) {
        const n = points[(i + 1) % points.length];
        cdt.insertConstraint(point, n);
    }
    console.timeEnd("AS");
}
