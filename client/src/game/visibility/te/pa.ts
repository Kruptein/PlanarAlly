/* eslint-disable */
import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";
import { visibilityStore } from "../store";
import { CDT } from "./cdt";
import { IterativeDelete } from "./iterative";
export enum TriangulationTarget {
    VISION = "vision",
    MOVEMENT = "movement",
}
export let PA_CDT = {
    vision: new CDT(),
    a: new CDT(),
    movement: new CDT(),
};

export const RR: {
    A: { op: string; shape: string; closed: boolean; points: string; v: number; t: number }[];
    I: { shape: string; closed: boolean; points: string }[];
    CPP: string[];
} = { A: [], I: [], CPP: [] };

export function insertConstraint(target: TriangulationTarget, shape: Shape, pa: number[], pb: number[]): void {
    const cdt = PA_CDT[target];
    const { va, vb } = cdt.insertConstraint(pa, pb);
    va.shapes.add(shape);
    vb.shapes.add(shape);
    cdt.tds.addTriagVertices(shape.uuid, va, vb);
}

export function triangulate(target: TriangulationTarget): void {
    console.warn(`RETRIANGULATING ${target}`);
    console.time("TRI");
    const cdt = new CDT();
    PA_CDT[target] = cdt;
    let shapes;
    if (target === "vision") shapes = visibilityStore.visionBlockers;
    else shapes = visibilityStore.movementblockers;
    
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
    for (const sh of shapes) {
        const shape = layerManager.UUIDMap.get(sh)!;
        if (shape.points.length <= 1) continue;
        RR.I.push({ shape: shape.uuid, closed: shape.isClosed, points: JSON.stringify(shape.points) });
        const j = shape.isClosed ? 0 : 1;
        for (let i = 0; i < shape.points.length - j; i++) {
            const pa = shape.points[i];
            const pb = shape.points[(i + 1) % shape.points.length];
            insertConstraint(target, shape, pa, pb);
        }
    }
    (<any>window).CDT = PA_CDT;
    console.timeEnd("TRI");
}
(<any>window).TRIAG = triangulate;

export function addShapesToTriag(target: TriangulationTarget, ...shapes: Shape[]): void {
    // console.time("AS");
    // eslint-disable-next-line
    // const S = JSON.stringify(
    //     layerManager
    //         .getLayer()!
    //         .shapes.filter(s => s.points.length > 1)
    //         .map(s => s.points),
    // );
    // const cdt = PA_CDT.a;
    // cdt.tds.dimension = PA_CDT[target].tds.dimension;
    // cdt.tds._infinite = PA_CDT[target].tds._infinite;
    // cdt.tds.triangles = [...PA_CDT[target].tds.triangles];
    // cdt.tds.vertices = [...PA_CDT[target].tds.vertices];
    // for (const triangle of PA_CDT[target].tds.triangles) {
    //     cdt.tds.triangles.push(triangle);
    // }
    // for (const vertices of PA_CDT[target].tds.vertices)
    //     cdt.tds.vertices.push(vertex)
    const a = PA_CDT[target].tds.vertices.length;
    const b = PA_CDT[target].tds.triangles.length;
    const c = (<any>PA_CDT[target].tds).triagVertices;
    for (const shape of shapes) {
        if (shape.points.length <= 1) continue;
        RR.A.push({
            op: "add",
            shape: shape.uuid,
            closed: shape.isClosed,
            points: JSON.stringify(shape.points),
            v: PA_CDT[target].tds.vertices.length,
            t: PA_CDT[target].tds.triangles.length,
        });
        const j = shape.isClosed ? 0 : 1;
        for (let i = 0; i <= shape.points.length - j; i++) {
            const pa = shape.points[i % shape.points.length];
            const pb = shape.points[(i + 1) % shape.points.length];
            // console.log(`Adding constraint between [${pa} and ${pb}]`);
            RR.CPP.push(`cdt.insert_constraint(Point(${pa[0]}, ${pa[1]}), Point(${pb[0]}, ${pb[1]}));`);
            insertConstraint(target, shape, pa, pb);
        }
    }
    // console.timeEnd("AS");
}

export function deleteShapeFromTriag(target: TriangulationTarget, shape: Shape): void {
    if (shape.points.length <= 1) return;
    RR.A.push({
        op: "del",
        shape: shape.uuid,
        closed: shape.isClosed,
        points: JSON.stringify(shape.points),
        v: PA_CDT[target].tds.vertices.length,
        t: PA_CDT[target].tds.triangles.length,
    });
    new IterativeDelete(target, shape);
}
