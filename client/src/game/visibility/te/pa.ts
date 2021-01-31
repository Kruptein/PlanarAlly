import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";

import { visibilityStore } from "../store";
import { getBlockers } from "../utils";

import { CDT } from "./cdt";
import { IterativeDelete } from "./iterative";

export enum TriangulationTarget {
    VISION = "vision",
    MOVEMENT = "movement",
}

const PA_CDT: Map<number, { vision: CDT; movement: CDT }> = new Map();

export function getCDT(target: TriangulationTarget, floor: number): CDT {
    return PA_CDT.get(floor)![target];
}

export function setCDT(target: TriangulationTarget, floor: number, cdt: CDT): void {
    PA_CDT.set(floor, { ...PA_CDT.get(floor)!, [target]: cdt });
}

export function addCDT(floor: number): void {
    PA_CDT.set(floor, { vision: new CDT(), movement: new CDT() });
    visibilityStore.movementBlockers.push({ floor, blockers: [] });
    visibilityStore.visionBlockers.push({ floor, blockers: [] });
    visibilityStore.visionSources.push({ floor, sources: [] });
}

export function removeCDT(floor: number): void {
    PA_CDT.delete(floor);
}

export function insertConstraint(target: TriangulationTarget, shape: Shape, pa: number[], pb: number[]): void {
    const cdt = getCDT(target, shape.floor.id);
    const { va, vb } = cdt.insertConstraint(pa, pb);
    va.shapes.add(shape);
    vb.shapes.add(shape);
    cdt.tds.addTriagVertices(shape.uuid, va, vb);
}

export function triangulate(target: TriangulationTarget, floor: number): void {
    const cdt = new CDT();
    setCDT(target, floor, cdt);
    const shapes = getBlockers(target, floor);

    for (const sh of shapes) {
        const shape = layerManager.UUIDMap.get(sh)!;
        if (shape.floor.id !== floor) continue;
        const j = shape.isClosed ? 0 : 1;
        for (let i = 0; i < shape.points.length - j; i++) {
            const pa = shape.points[i].map((n) => parseFloat(n.toFixed(10)));
            const pb = shape.points[(i + 1) % shape.points.length].map((n) => parseFloat(n.toFixed(10)));
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
    (window as any).CDT = PA_CDT;
}
(window as any).TRIAG = triangulate;

export function addShapesToTriag(target: TriangulationTarget, ...shapes: Shape[]): void {
    // console.time("AS");
    for (const shape of shapes) {
        if (shape.points.length <= 1) continue;
        const j = shape.isClosed ? 0 : 1;
        for (let i = 0; i < shape.points.length - j; i++) {
            const pa = shape.points[i % shape.points.length];
            const pb = shape.points[(i + 1) % shape.points.length];
            insertConstraint(target, shape, pa, pb);
        }
    }
    // console.timeEnd("AS");
}

export function deleteShapeFromTriag(target: TriangulationTarget, shape: Shape): void {
    if (shape.points.length <= 1) return;
    new IterativeDelete(target, shape);
}

// function logTriags(cdt: CDT): void {
//     console.log(`${cdt.tds.getEdges(true).length}/${cdt.tds.getEdges(false).length}`);
//     let a = "";
//     for (const triangle of cdt.tds.triangles) {
//         if (triangle.vertices.length !== 3) continue;
//         a += `${triangle.uid}\t${logPoint(triangle.vertices[0]!.point ?? [0, 0])}\t${logPoint(
//             triangle.vertices[1]!.point ?? [0, 0],
//         )}\t${logPoint(triangle.vertices[2]!.point ?? [0, 0])}\t${triangle.neighbours[0]?.uid}\t${
//             triangle.neighbours[1]?.uid
//         }\t${triangle.neighbours[2]?.uid}\n`;
//     }
//     console.log(a);
// }

// function logPoint(point: Point): string {
//     return `${+point[0].toFixed(3)},${+point[1].toFixed(3)}`;
// }
