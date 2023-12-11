import { filter } from "../../core/iter";
import { equalPoints } from "../../core/math";
import type { IShape } from "../interfaces/shape";

import type { CDT } from "./cdt";
import { visionState } from "./state";
import type { TriangulationTarget } from "./state";
import { Sign } from "./tds";
import type { Edge, Triangle, Vertex } from "./tds";
import { ccw, collinear, collinearInOrder, cw, xyCompare, xyEqual, xySmaller } from "./triag";

interface Constraint {
    combined: [Vertex, Vertex];
    segments: [Vertex, Vertex][];
}

function mergeConstraints(constraintA: Constraint, constraintB: Constraint): Constraint | null {
    const [A0, A1] = constraintA.combined;
    const [B0, B1] = constraintB.combined;
    if (!collinear(A0.point!, A1.point!, B0.point!)) {
        if (!xyEqual(A0.point!, B0.point!) || !xyEqual(A1.point!, B0.point!)) return null;
    }
    if (!collinear(A0.point!, A1.point!, B1.point!)) {
        if (!xyEqual(A0.point!, B1.point!) || !xyEqual(A1.point!, B1.point!)) return null;
    }
    const newSegmentList: [Vertex, Vertex][] = [];
    let iA = constraintA.segments.length - 1;
    let iB = constraintB.segments.length - 1;
    while (iA >= 0 && iB >= 0) {
        const comp = xyCompare(constraintA.segments[iA]![1].point!, constraintB.segments[iB]![1].point!);
        if (comp === Sign.SMALLER) {
            newSegmentList.unshift(constraintB.segments.pop()!);
            iB--;
        } else if (comp === Sign.LARGER) {
            newSegmentList.unshift(constraintA.segments.pop()!);
            iA--;
        } else {
            newSegmentList.unshift(constraintA.segments.pop()!);
            constraintB.segments.pop();
            iB--;
            iA--;
        }
    }
    if (iA >= 0) newSegmentList.unshift(...constraintA.segments.slice(0, iA + 1));
    if (iB >= 0) newSegmentList.unshift(...constraintB.segments.slice(0, iB + 1));
    return { combined: [newSegmentList[0]![0], newSegmentList.at(-1)![1]], segments: newSegmentList };
}

interface NewConstraint {
    edge: Constraint;
    changed: boolean;
    onPath: boolean;
}

export class IterativeDelete {
    private vertices: Vertex[];
    private edges: Edge[];
    private newConstraints: NewConstraint[];
    private handledPoints: [number, number][];
    private cdt: CDT;
    private shape: IShape;
    private finalConstraints: [Vertex, Vertex][];

    constructor(target: TriangulationTarget, shape: IShape) {
        this.vertices = [];
        this.edges = [];
        this.newConstraints = [];
        this.handledPoints = [];
        this.finalConstraints = [];

        if (shape.floorId === undefined) {
            throw new Error("Shape without floor passed");
        }
        this.cdt = visionState.getCDT(target, shape.floorId);
        this.shape = shape;

        this.deleteVertices();
        this.joinConstraints();
        this.trimConstraints();
        this.finalise();
    }

    private deleteVertices(): void {
        const vertices = this.cdt.tds.getTriagVertices(this.shape.id);
        const np = vertices.length;
        let from = vertices[np - 1]!;
        for (const [i, vertex] of vertices.entries()) {
            const n = vertices[(i + 1) % np]!;
            from = this.deleteVertex(vertex, from, n, true);
        }
    }

    private joinConstraints(): void {
        for (let i = this.newConstraints.length - 1; i >= 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                const A = this.newConstraints[i]!.edge;
                const B = this.newConstraints[j]!.edge;
                if (
                    equalPoints(A.combined[0].point!, B.combined[0].point!) &&
                    equalPoints(A.combined[1].point!, B.combined[1].point!)
                ) {
                    this.newConstraints.splice(j, 1);
                    break;
                }
                const join = mergeConstraints(A, B);
                if (join !== null) {
                    this.newConstraints.splice(i, 1);
                    this.newConstraints.splice(j, 1, { edge: join, changed: true, onPath: false });
                    break;
                }
            }
        }
    }

    private trimConstraints(): void {
        for (const newConstraint of this.newConstraints) {
            if (!newConstraint.changed) continue;
            const constraint = newConstraint.edge;
            while (constraint.segments.length > 1 && this.vertices.includes(constraint.combined[0])) {
                constraint.segments.shift();
                constraint.combined[0] = constraint.segments[0]![0];
            }
            while (constraint.segments.length > 1 && this.vertices.includes(constraint.combined[1])) {
                constraint.segments.pop();
                constraint.combined[1] = constraint.segments.at(-1)![1];
            }
            if (constraint.segments.length > 1) this.finalConstraints.push(constraint.combined);
        }
    }

    private finalise(): void {
        // During constraint removal, triangles can flip and thus the edges we tracked can become broken
        // To fix them we need to keep track of the changed faces and adjust accordingly.
        const flippedFaces: [Triangle, number, Triangle, number][][] = [];
        for (const edge of this.edges) {
            for (const ff of flippedFaces) {
                for (const fff of ff) {
                    if (fff[0] === edge.first && cw(edge.second) === fff[1]) {
                        edge.first = fff[2];
                        edge.second = fff[3];
                    } else if (fff[2] === edge.first && cw(edge.second) === fff[3]) {
                        edge.first = fff[0];
                        edge.second = fff[1];
                    }
                }
            }
            flippedFaces.push(this.cdt.removeConstrainedEdgeDelaunay(edge.first!, edge.second));
        }
        for (const vertex of this.vertices) this.cdt.removeVertex(vertex);
        for (const [from_, to] of this.finalConstraints) this.cdt.insertConstraintV(from_, to);
        this.cdt.tds.clearTriagVertices(this.shape.id);
    }

    private deleteVertex(vertex: Vertex, from: Vertex, target: Vertex, isCorner: boolean): Vertex {
        /*
         * When cross-intersecting a polygon, a point is visited multiple times,
         * we can skip a bunch of steps on subsequent arrivals in such points,
         * but we need to ensure that any interruption towards the new target
         * is handled properly and not skipped.
         */
        const pointHandled = this.handledPoints.some((p) => equalPoints(p, vertex.point!));
        const sharesVertex = vertex.shapes.size >= (isCorner ? 2 : 1);
        if (!sharesVertex && !pointHandled) this.vertices.push(vertex);
        let nextIntersect: Vertex | null = null;
        for (const edge of vertex.getIncidentEdges(true)) {
            const ccwv = edge.first!.vertices[ccw(edge.second)]!;
            const ccwp = ccwv.point!;
            // layerManager.getLayer(floorStore.currentFloor.name, "draw")!.clear();
            // drawPoint(vertex.point!, 10, {colour: "blue"});
            // drawPoint(ccwp, 10, {colour: "green"});
            const edgeCovered = equalPoints(ccwp, from.point!) || collinearInOrder(vertex.point!, ccwp, from.point!);
            const targetEdge = equalPoints(ccwp, target.point!);
            const edgeInterruption =
                !edgeCovered && !targetEdge && collinearInOrder(vertex.point!, ccwp, target.point!);
            const onPath = edgeCovered || edgeInterruption || targetEdge;
            if (edgeInterruption) {
                nextIntersect = ccwv;
            } else if (pointHandled) {
                continue;
            }
            const ev = (edge.vertices() as [Vertex, Vertex]).sort((a: Vertex, b: Vertex) =>
                xySmaller(a.point!, b.point!) ? -1 : 1,
            );
            const constraint: Constraint = {
                combined: ev,
                segments: [ev],
            };
            this.newConstraints.push({ edge: constraint, changed: false, onPath });
            if (edgeCovered) continue;
            const edgeShapes = [...filter(vertex.shapes, (sh) => ccwv.shapes.has(sh) && sh !== this.shape.id)];
            if (edgeShapes.length === 0) this.addEdge(edge);
        }
        this.handledPoints.push(vertex.point!);
        if (nextIntersect === null) return vertex;
        return this.deleteVertex(nextIntersect, vertex, target, false);
    }

    private addEdge(edge: Edge): void {
        const ev = (edge.vertices() as [Vertex, Vertex]).sort((a: Vertex, b: Vertex) =>
            xySmaller(a.point!, b.point!) ? -1 : 1,
        );
        for (const e of this.edges) {
            const evO = (e.vertices() as [Vertex, Vertex]).sort((a: Vertex, b: Vertex) =>
                xySmaller(a.point!, b.point!) ? -1 : 1,
            );
            if (equalPoints(ev[0].point!, evO[0].point!) && equalPoints(ev[1].point!, evO[1].point!)) return;
        }
        this.edges.push(edge);
    }
}
