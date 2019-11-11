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
    for (const sh of shapes) {
        const shape = layerManager.UUIDMap.get(sh)!;
        const j = shape.isClosed ? 0 : 1;
        for (let i = 0; i < shape.points.length - j; i++) {
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
    // console.time("AS");
    for (const shape of shapes) {
        if (shape.points.length <= 1) continue;
        const j = shape.isClosed ? 0 : 1;
        for (let i = 0; i <= shape.points.length - j; i++) {
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
