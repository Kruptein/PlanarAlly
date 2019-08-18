import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";
import { equalPoints } from "@/game/utils";
import { visibilityStore } from "../store";
import { CDT } from "./cdt";
import { Edge, Vertex } from "./tds";
import { a, b, ccw, collinearInOrder, Constraint, xySmaller } from "./triag";
export enum TriangulationTarget {
    VISION = "vision",
    MOVEMENT = "movement",
}
export let PA_CDT = {
    vision: new CDT(),
    a: new CDT(),
    movement: new CDT(),
};

export function insertConstraint(target: TriangulationTarget, shape: Shape, pa: number[], pb: number[]): void {
    const { va, vb } = PA_CDT[target].insertConstraint(pa, pb);
    va.shapes.add(shape);
    vb.shapes.add(shape);
    shape.addTriagVertices(va, vb);
}

export function triangulate(target: TriangulationTarget): void {
    console.warn(`RETRIANGULATING ${target}`);
    console.time("TRI");
    const cdt = new CDT();
    PA_CDT[target] = cdt;
    let shapes;
    if (target === "vision") shapes = visibilityStore.visionBlockers;
    else shapes = gameStore.movementblockers;
    for (const sh of shapes) {
        const shape = layerManager.UUIDMap.get(sh)!;
        for (let i = 0; i < shape.points.length; i++) {
            const pa = shape.points[i];
            const pb = shape.points[(i + 1) % shape.points.length];
            insertConstraint(target, shape, pa, pb);
        }
    }
    // // console.log(s);
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
    (<any>window).CDT = PA_CDT;
    console.timeEnd("TRI");
}
(<any>window).TRIAG = triangulate;

export function addShapesToTriag(target: TriangulationTarget, ...shapes: Shape[]): void {
    console.time("AS");
    // const cdt = PA_CDT.a;
    for (const shape of shapes) {
        for (const [i, pa] of shape.points.entries()) {
            const pb = shape.points[(i + 1) % shape.points.length];
            // console.log(`Adding constraint between [${pa} and ${pb}]`);
            insertConstraint(target, shape, pa, pb);
        }
    }
    console.timeEnd("AS");
}
interface DeleteQueue0 {
    vertices: Set<Vertex>;
    edges: Set<Edge>;
    newConstraints: Constraint[];
}
function deleteIntersectVertex0(
    shape: Shape,
    vertex: Vertex,
    from: Vertex,
    target: Vertex,
    queues: DeleteQueue0,
    isCorner: boolean,
): Vertex {
    const sharesVertex = vertex.shapes.size >= (isCorner ? 2 : 1);
    if (!sharesVertex) queues.vertices.add(vertex);
    let nextIntersect: Vertex | null = null;
    const constraints: {
        edge: Constraint;
        changed: boolean;
        onPath: boolean;
    }[] = [];
    for (const edge of vertex.getIncidentEdges(true)) {
        const ccwv = edge.first!.vertices[ccw(edge.second)]!;
        const ccwp = ccwv.point!;
        const edgeCovered = equalPoints(ccwp, from.point!) || collinearInOrder(vertex.point!, ccwp, from.point!);
        const targetEdge = equalPoints(ccwp, target.point!);
        const edgeInterruption = !edgeCovered && !targetEdge && collinearInOrder(vertex.point!, ccwp, target.point!);
        const onPath = edgeCovered || edgeInterruption || targetEdge;
        if (edgeInterruption) {
            nextIntersect = ccwv;
        }
        const ev = (edge.vertices() as [Vertex, Vertex]).sort((a: Vertex, b: Vertex) =>
            xySmaller(a.point!, b.point!) ? -1 : 1,
        );
        let constraint: Constraint = {
            combined: ev,
            segments: [ev],
        };
        let changed = false;
        for (let i = constraints.length - 1; i >= 0; i--) {
            if (onPath && constraints[i].onPath) continue;
            const newConstraint = a(constraints[i].edge, constraint);
            if (newConstraint !== null) {
                changed = true;
                constraints.splice(i, 1);
                constraint = newConstraint;
            }
        }
        constraints.push({ edge: constraint, changed, onPath });
        if (edgeCovered) continue;
        const edgeShapes = [...vertex.shapes].filter(sh => ccwv.shapes.has(sh) && sh !== shape);
        if (edgeShapes.length === 0) queues.edges.add(edge);
    }
    if (nextIntersect === null) return vertex;
    return deleteIntersectVertex0(shape, nextIntersect, vertex, target, queues, false);
}
export function deleteShapeFromTriag0(target: TriangulationTarget, shape: Shape): void {
    console.time("DS");
    const cdt = PA_CDT[target];
    const queues: DeleteQueue0 = {
        vertices: new Set(),
        edges: new Set(),
        newConstraints: [],
    };
    const np = shape.triagVertices.length;
    let from = shape.triagVertices[np - 1];
    for (const [i, vertex] of shape.triagVertices.entries()) {
        const n = shape.triagVertices[(i + 1) % np];
        from = deleteIntersectVertex0(shape, vertex, from, n, queues, true);
    }
    const actualConstraints: [Vertex, Vertex][] = [];
    for (let i = queues.newConstraints.length - 1; i >= 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
            const join = b(queues.newConstraints[i], queues.newConstraints[j]);
            if (join !== null) {
                queues.newConstraints.splice(i, 1);
                queues.newConstraints.splice(j, 1, join);
                break;
            }
        }
    }
    for (const constraint of queues.newConstraints) {
        while (constraint.segments.length > 1 && queues.vertices.has(constraint.combined[0])) {
            constraint.segments.shift();
            constraint.combined[0] = constraint.segments[0][0];
        }
        while (constraint.segments.length > 1 && queues.vertices.has(constraint.combined[1])) {
            constraint.segments.pop();
            constraint.combined[1] = constraint.segments[constraint.segments.length - 1][1];
        }
        if (constraint.segments.length > 1) actualConstraints.push(constraint.combined);
    }

    for (const edge of queues.edges) cdt.removeConstrainedEdgeDelaunay(edge.first!, edge.second);
    for (const vertex of queues.vertices) cdt.removeVertex(vertex);
    for (const [from_, to] of actualConstraints) cdt.insertConstraintV(from_, to);
    shape.clearTriagVertices();
    console.timeEnd("DS");
}

interface DeleteQueue {
    vertices: Set<Vertex>;
    edges: Set<Edge>;
    newConstraints: {
        edge: Constraint;
        changed: boolean;
        onPath: boolean;
    }[];
}

function deleteIntersectVertex(
    shape: Shape,
    vertex: Vertex,
    from: Vertex,
    target: Vertex,
    queues: DeleteQueue,
    isCorner: boolean,
): Vertex {
    const sharesVertex = vertex.shapes.size >= (isCorner ? 2 : 1);
    if (!sharesVertex) queues.vertices.add(vertex);
    let nextIntersect: Vertex | null = null;
    for (const edge of vertex.getIncidentEdges(true)) {
        const ccwv = edge.first!.vertices[ccw(edge.second)]!;
        const ccwp = ccwv.point!;
        const edgeCovered = equalPoints(ccwp, from.point!) || collinearInOrder(vertex.point!, ccwp, from.point!);
        const targetEdge = equalPoints(ccwp, target.point!);
        const edgeInterruption = !edgeCovered && !targetEdge && collinearInOrder(vertex.point!, ccwp, target.point!);
        const onPath = edgeCovered || edgeInterruption || targetEdge;
        if (edgeInterruption) {
            nextIntersect = ccwv;
        }
        const ev = (edge.vertices() as [Vertex, Vertex]).sort((a: Vertex, b: Vertex) =>
            xySmaller(a.point!, b.point!) ? -1 : 1,
        );
        let constraint: Constraint = {
            combined: ev,
            segments: [ev],
        };
        queues.newConstraints.push({ edge: constraint, changed: false, onPath });
        if (edgeCovered) continue;
        const edgeShapes = [...vertex.shapes].filter(sh => ccwv.shapes.has(sh) && sh !== shape);
        if (edgeShapes.length === 0) queues.edges.add(edge);
    }
    if (nextIntersect === null) return vertex;
    return deleteIntersectVertex(shape, nextIntersect, vertex, target, queues, false);
}
export function deleteShapeFromTriag(target: TriangulationTarget, shape: Shape): void {
    console.time("DS");
    const cdt = PA_CDT[target];
    const queues: DeleteQueue = {
        vertices: new Set(),
        edges: new Set(),
        newConstraints: [],
    };
    const np = shape.triagVertices.length;
    let from = shape.triagVertices[np - 1];
    for (const [i, vertex] of shape.triagVertices.entries()) {
        const n = shape.triagVertices[(i + 1) % np];
        from = deleteIntersectVertex(shape, vertex, from, n, queues, true);
    }
    const actualConstraints: [Vertex, Vertex][] = [];
    for (let i = queues.newConstraints.length - 1; i >= 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
            const A = queues.newConstraints[i].edge;
            const B = queues.newConstraints[j].edge;
            if (
                equalPoints(A.combined[0].point!, B.combined[0].point!) &&
                equalPoints(A.combined[1].point!, B.combined[1].point!)
            ) {
                queues.newConstraints.splice(j, 1);
                break;
            }
            const join = b(A, B);
            if (join !== null) {
                queues.newConstraints.splice(i, 1);
                queues.newConstraints.splice(j, 1, { edge: join, changed: true, onPath: false });
                break;
            }
        }
    }
    for (let i = 0; i < queues.newConstraints.length; i++) {
        const newConstraint = queues.newConstraints[i];
        if (!newConstraint.changed) continue;
        const constraint = newConstraint.edge;
        while (constraint.segments.length > 1 && queues.vertices.has(constraint.combined[0])) {
            constraint.segments.shift();
            constraint.combined[0] = constraint.segments[0][0];
        }
        while (constraint.segments.length > 1 && queues.vertices.has(constraint.combined[1])) {
            constraint.segments.pop();
            constraint.combined[1] = constraint.segments[constraint.segments.length - 1][1];
        }
        if (constraint.segments.length > 1) actualConstraints.push(constraint.combined);
    }

    for (const edge of queues.edges) cdt.removeConstrainedEdgeDelaunay(edge.first!, edge.second);
    for (const vertex of queues.vertices) cdt.removeVertex(vertex);
    for (const [from_, to] of actualConstraints) cdt.insertConstraintV(from_, to);
    shape.clearTriagVertices();
    console.timeEnd("DS");
}
