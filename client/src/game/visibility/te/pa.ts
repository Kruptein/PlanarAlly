import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";
import { equalPoints } from "@/game/utils";
import { visibilityStore } from "../store";
import { CDT } from "./cdt";
import { Edge, Vertex } from "./tds";
import { ccw, collinearInOrder, connectLinear, joinOverlap } from "./triag";

export enum TriangulationTarget {
    VISION = "vision",
    MOVEMENT = "movement",
}

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

interface DeleteQueue {
    vertices: Set<Vertex>;
    edges: Edge[];
    newConstraints: Vertex[][];
    constrainedEdges: Edge[];
}

function handleConstrainedEdgeKept(edge: Edge, queues: DeleteQueue): void {
    for (let i = queues.constrainedEdges.length - 1; i >= 0; i--) {
        const newEdge = connectLinear(queues.constrainedEdges[i], edge);
        if (newEdge !== null) {
            queues.edges.push(edge, queues.constrainedEdges[i]);
            queues.newConstraints.push(newEdge.borders);
            queues.constrainedEdges.splice(i, 1);
            return;
        }
    }
    queues.constrainedEdges.push(edge);
}

// Todo:
// - Move to a class to simplify state tracking
// - Only check the constrainedEdge stuff when the queue actually changes
function deleteIntersectVertex(
    vertex: Vertex,
    from: Vertex,
    target: Vertex,
    queues: DeleteQueue,
    isCorner: boolean,
): Vertex {
    const sharesVertex = vertex.shapes.size >= (isCorner ? 2 : 1);
    if (!sharesVertex) queues.vertices.add(vertex);
    const edges = [...vertex.getIncidentEdges()].filter(e => e.first!.constraints[e.second]);
    let fixBridge: Vertex[] = [];
    let nextIntersect: Vertex | null = null;
    for (const edge of edges) {
        const ccwv = edge.first!.vertices[ccw(edge.second)]!;
        const ccwp = ccwv.point!;
        const sharesCCWP = ccwv.shapes.size > (ccwv === target ? 1 : 0);
        if (equalPoints(ccwp, target.point!)) {
            if (!(sharesVertex && sharesCCWP)) queues.edges.push(edge);
        } else if (equalPoints(ccwp, from.point!)) {
            continue;
        } else if (collinearInOrder(vertex.point!, ccwp, from.point!)) {
            continue;
        } else if (collinearInOrder(vertex.point!, ccwp, target.point!)) {
            if (nextIntersect !== null) console.warn("Multiple collinear vertices found?");
            if (sharesCCWP && edges.length === 3) handleConstrainedEdgeKept(edge, queues);
            else if (!sharesCCWP) queues.edges.push(edge);
            nextIntersect = ccwv;
        } else if (edges.length === 3) {
            handleConstrainedEdgeKept(edge, queues);
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
            } else {
                fixBridge.push(ccwv);
            }
        }
    }
    if (queues.constrainedEdges.length > 0) {
        for (let ci = queues.constrainedEdges.length - 1; ci >= 0; ci--) {
            for (let i = 0; i < queues.edges.length; i++) {
                const newEdge = connectLinear(queues.edges[i], queues.constrainedEdges[ci]);
                if (newEdge !== null && queues.vertices.has(newEdge.connection)) {
                    queues.edges.push(queues.constrainedEdges[ci]);
                    queues.newConstraints.push(newEdge.borders);
                    queues.constrainedEdges.splice(ci, 1);
                    break;
                }
            }
        }
    }
    if (edges.length === 4 && fixBridge.length > 0) queues.newConstraints.push(fixBridge);
    if (nextIntersect === null) return vertex;
    return deleteIntersectVertex(nextIntersect, vertex, target, queues, false);
}

export function deleteShapeFromTriag(target: TriangulationTarget, shape: Shape): void {
    const cdt = PA_CDT[target];
    const queues: DeleteQueue = {
        vertices: new Set(),
        edges: [],
        newConstraints: [],
        constrainedEdges: [],
    };
    const np = shape.triagVertices.length;
    let from = shape.triagVertices[np - 1];
    for (const [i, vertex] of shape.triagVertices.entries()) {
        const n = shape.triagVertices[(i + 1) % np];
        from = deleteIntersectVertex(vertex, from, n, queues, true);
    }

    for (let c1 = queues.newConstraints.length - 1; c1 >= 0; c1--) {
        for (let c2 = c1 - 1; c2 >= 0; c2--) {
            const e = joinOverlap(queues.newConstraints[c1], queues.newConstraints[c2]);
            if (e !== null) {
                queues.newConstraints.splice(c1, 1);
                queues.newConstraints.splice(c2, 1, e);
                break;
            }
        }
    }

    for (const edge of queues.edges) cdt.removeConstrainedEdgeDelaunay(edge.first!, edge.second);
    for (const vertex of queues.vertices) cdt.removeVertex(vertex);
    for (const [from_, to] of queues.newConstraints) cdt.insertConstraintV(from_, to);
    shape.removeTriagVertices(...queues.vertices);
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
