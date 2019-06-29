import { layerManager } from "@/game/layers/manager";
import { Shape } from '@/game/shapes/shape';
import { gameStore } from "@/game/store";
import { equalPoints } from '@/game/utils';
import { CDT } from "./cdt";
import { drawPoint, drawPolygonT } from './draw';
import { Edge, Vertex } from './tds';
import { ccw, collinearBetween } from './triag';


export let PA_CDT = {
    vision: new CDT(),
    movement: new CDT(),
};

export let POINT_VERTEX_MAP: {[key: string]: Vertex} = {};

export function triangulate(target: "vision" | "movement", partial: boolean = false) {
    console.warn("RETRIANGULATING");
    const cdt = new CDT();

    let shapes;
    if (target === "vision") shapes = gameStore.visionBlockers;
    else shapes = gameStore.movementblockers;

    let s = "";

    for (const sh of shapes) {
        const shape = layerManager.UUIDMap.get(sh)!;
        if (partial && !shape.visibleInCanvas(layerManager.getLayer()!.canvas)) continue;
        for (let i = 0; i < shape.points.length; i++) {
            const pa = shape.points[i];
            const pb = shape.points[(i + 1) % shape.points.length];
            s += `cdt.insert_constraint(Point(${pa[0]}, ${pa[1]}), Point(${pb[0]}, ${pb[1]}));\n\t`;
            const {va, vb} = cdt.insertConstraint(pa, pb);
            // drawPolygonT(cdt.tds, false, true, 1);
            if (POINT_VERTEX_MAP[`${pa[0]}:${pa[1]}`] === undefined) POINT_VERTEX_MAP[`${pa[0]}:${pa[1]}`] = va;
            if (POINT_VERTEX_MAP[`${pb[0]}:${pb[1]}`] === undefined) POINT_VERTEX_MAP[`${pb[0]}:${pb[1]}`] = vb;
        }
    }
    console.log(s);
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
    // drawPolygonT(cdt.tds, false, true, 1);
    PA_CDT[target] = cdt;
    // drawPolygonT(PA_CDT[target].tds, false, true, 2);
    (<any>window).CDT = PA_CDT;
    (<any>window).PVM = POINT_VERTEX_MAP;
    if (target === "vision") drawPolygonT(PA_CDT[target].tds, false, true, 1);
}

function deleteIntersectVertex(vertex: Vertex, from: number[], target: number[], queues: {vertices: Set<Vertex>; edges: Edge[], newConstraints: Vertex[][], triBridge: Vertex[]}): number[] {
    // let newFrom = vertex.point!;
    queues.vertices.add(vertex);
    const edges = [...vertex.getIncidentEdges()].filter(e => e.first!.constraints[e.second]);
    let fixBridge: Vertex[] = [];
    let nextIntersect: Vertex | null = null;
    for (const edge of edges) {
        const ccwv = edge.first!.vertices[ccw(edge.second)]!;
        const ccwp = ccwv.point!;
        layerManager.getLayer("draw")!.clear();
        drawPoint(vertex.point!, 10, "green");
        drawPoint(target, 10, "blue");
        drawPoint(ccwp, 10, "orange");
        drawPoint(from, 10, "red");
        if (equalPoints(ccwp, target)) queues.edges.push(edge);
        else if(equalPoints(ccwp, from)) continue;
        else if (collinearBetween(vertex.point!, ccwp, target)) {
            if (nextIntersect !== null) console.warn("Multiple collinear vertices found?");
            queues.edges.push(edge);
            // newFrom = deleteIntersectVertex(ccwv, vertex.point!, target, queues);
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
    // return newFrom;
    if (nextIntersect === null) return vertex.point!;
    return deleteIntersectVertex(nextIntersect, vertex.point!, target, queues);
}

export function deleteShape(shape: Shape) {
    const cdt = PA_CDT.vision;
    const queues: {vertices: Set<Vertex>; edges: Edge[], newConstraints: Vertex[][], triBridge: Vertex[]} = {vertices: new Set(), edges: [], newConstraints: [], triBridge: []};
    const np = shape.points.length;
    let from = shape.points[np - 1];
    for (const [i, point] of shape.points.entries()) {
        const n = shape.points[(i + 1) % np];
        // const p = shape.points[(i - 1 + np) % np];
        // pointQueue.push(point);
        const vertex = cdt.tds.vertices.reduce((acc: Vertex[], prev) => equalPoints(prev.point!, point) ? [...acc, prev] : acc , [])[0]
        from = deleteIntersectVertex(vertex, from, n, queues);
        // for (const edge of vert.getIncidentEdges()) {
        //     if (edge.first!.constraints[edge.second]) {
        //         const ccwv = edge.first!.vertices[ccw(edge.second)]!;
        //         const ccwp = ccwv.point!;
        //         if (equalPoints(ccwp, n)) {
        //             edgeQueue.push(edge);
        //         } else if (collinearBetween(point, ccwp, n)) {
        //             deleteIntersectVertex(ccwv, n, pointQueue, edgeQueue);
        //         }
        //     }
        // }
    }
    let TTT = '';
    for (const edge of queues.edges) {
        // console.log(`cdt.remove_constrained_edge()`)
        console.log(edge.first!.center, edge.second);
        TTT += `cdt.remove_constrained_edge(cdt.locate(Point(${edge.first!.center[0]}, ${edge.first!.center[1]})), ${edge.second});\n\t`;
        cdt.removeConstrainedEdgeDelaunay(edge.first!, edge.second);
    }
    const layer = layerManager.getLayer();
    if (layer) {
        layer.clearSelection()
        layer.invalidate(true);
        layer.draw();
    }
    drawPolygonT(cdt.tds, false);
    console.log(queues.vertices.size);
    for (const vertex of queues.vertices) {
        console.log(`Removing ${vertex.point}`);
        drawPoint(vertex.point!, 10, "red");
        cdt.removeVertex(vertex);
        drawPolygonT(cdt.tds, false);
    }
    for (const [from_, to] of queues.newConstraints) cdt.insertConstraintV(from_, to);
    // for (const {point, p, n} of pointQueue) {
    //     // const vert = POINT_VERTEX_MAP[`${vertex[0]}:${vertex[1]}`];
    //     const vert = cdt.tds.vertices.reduce((acc: Vertex[], prev) => prev.point![0] === point[0] && prev.point![1] === point[1] ? [...acc, prev] : acc , [])[0]
    //     if (vert === undefined) continue;
    //     for (const edge of vert.getIncidentEdges()) {
    //         if (edge.first!.constraints[edge.second]) {
    //             cdt.removeConstrainedEdgeDelaunay(edge.first!, edge.second);
    //         }
    //     }
    //     console.log(`Removing vertex ${vert.point}`);
    //     PA_CDT["vision"].removeVertex(vert);
    //     drawPolygonT(cdt.tds, false);
    // }
}