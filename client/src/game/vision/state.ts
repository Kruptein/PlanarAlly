import { equalsP } from "../../core/geometry";
import { Store } from "../../core/store";
import { floorStore } from "../../store/floor";
import { UuidMap } from "../../store/shapeMap";
import { sendLocationOptions } from "../api/emits/location";
import type { Aura } from "../shapes/interfaces";
import type { Shape } from "../shapes/shape";
import type { Asset } from "../shapes/variants/asset";
import { getPaths, pathToArray } from "../svg";

import { CDT } from "./cdt";
import { IterativeDelete } from "./iterative";

export enum TriangulationTarget {
    VISION = "vision",
    MOVEMENT = "movement",
}

export enum VisibilityMode {
    TRIANGLE,
    TRIANGLE_ITERATIVE,
}

interface State {
    mode: VisibilityMode;
}

class VisionState extends Store<State> {
    private visionBlockers: Map<number, string[]> = new Map();
    private movementBlockers: Map<number, string[]> = new Map();
    private visionSources: Map<number, { shape: string; aura: string }[]> = new Map();

    private cdt: Map<number, { vision: CDT; movement: CDT }> = new Map();

    drawTeContour = false;

    protected data(): State {
        return {
            mode: VisibilityMode.TRIANGLE,
        };
    }

    clear(): void {
        this.visionBlockers.clear();
        this.movementBlockers.clear();
        this.visionSources.clear();
    }

    setVisionMode(mode: VisibilityMode, sync: boolean): void {
        this._state.mode = mode;

        for (const floor of floorStore.state.floors) {
            visionState.recalculateVision(floor.id);
            visionState.recalculateMovement(floor.id);
        }
        floorStore.invalidateAllFloors();

        if (sync)
            sendLocationOptions({
                options: { vision_mode: VisibilityMode[mode] },
                location: undefined,
            });
    }

    recalculate(data: { target: TriangulationTarget; floor: number }): void {
        if (this._state.mode === VisibilityMode.TRIANGLE) this.triangulate(data.target, data.floor);
    }

    recalculateVision(floor: number): void {
        if (this._state.mode === VisibilityMode.TRIANGLE) this.triangulate(TriangulationTarget.VISION, floor);
    }

    recalculateMovement(floor: number): void {
        if (this._state.mode === VisibilityMode.TRIANGLE) this.triangulate(TriangulationTarget.MOVEMENT, floor);
    }

    // CDT

    addCdt(floor: number): void {
        this.cdt.set(floor, { vision: new CDT(), movement: new CDT() });
        this.movementBlockers.set(floor, []);
        this.visionBlockers.set(floor, []);
        this.visionSources.set(floor, []);
    }

    getCDT(target: TriangulationTarget, floor: number): CDT {
        return this.cdt.get(floor)![target];
    }

    setCDT(target: TriangulationTarget, floor: number, cdt: CDT): void {
        this.cdt.set(floor, { ...this.cdt.get(floor)!, [target]: cdt });
    }

    removeCdt(floor: number): void {
        this.cdt.delete(floor);
    }

    // TRIANGULATION

    private triangulate(target: TriangulationTarget, floor: number): void {
        const cdt = new CDT();
        this.setCDT(target, floor, cdt);
        const shapes = this.getBlockers(target, floor);

        for (const sh of shapes) {
            const shape = UuidMap.get(sh)!;
            if (shape.floor.id !== floor) continue;

            if (shape.type === "assetrect") {
                const asset = shape as Asset;
                if (shape.options.svgAsset !== undefined && asset.svgData !== undefined) {
                    for (const svgData of asset.svgData) {
                        if (!equalsP(shape.refPoint, svgData.rp) || svgData.paths === undefined) {
                            const w = asset.w;
                            const h = asset.h;

                            const svg = svgData.svg as SVGSVGElement;

                            const dW = w / (svg.width.animVal.valueInSpecifiedUnits ?? 1);
                            const dH = h / (svg.height.animVal.valueInSpecifiedUnits ?? 1);

                            svgData.paths = [...getPaths(asset, svg as SVGSVGElement, dW, dH)];
                        }
                        for (const paths of svgData.paths) {
                            for (const path of paths) {
                                this.triangulatePath(target, shape, path, false);
                            }
                        }
                    }
                    continue;
                } else if (shape.options.svgPaths !== undefined) {
                    for (const pathString of shape.options.svgPaths ?? []) {
                        const w = asset.w;
                        const h = asset.h;

                        const dW = w / (shape.options.svgWidth ?? 1);
                        const dH = h / (shape.options.svgHeight ?? 1);

                        const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        pathElement.setAttribute("d", pathString);
                        const paths = pathToArray(shape as Asset, pathElement, dW, dH);
                        for (const path of paths) {
                            this.triangulatePath(target, shape, path, false);
                            break;
                        }
                    }
                    continue;
                }
            }
            this.triangulatePath(target, shape, shape.points, shape.isClosed);
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
        (window as any).CDT = this.cdt;
    }

    private triangulatePath(target: TriangulationTarget, shape: Shape, path: number[][], closed: boolean): void {
        const j = closed ? 0 : 1;
        for (let i = 0; i < path.length - j; i++) {
            const pa = path[i].map((n) => parseFloat(n.toFixed(10)));
            const pb = path[(i + 1) % path.length].map((n) => parseFloat(n.toFixed(10)));
            this.insertConstraint(target, shape, pa, pb);
        }
    }

    insertConstraint(target: TriangulationTarget, shape: Shape, pa: number[], pb: number[]): void {
        const cdt = this.getCDT(target, shape.floor.id);
        const { va, vb } = cdt.insertConstraint(pa, pb);
        va.shapes.add(shape);
        vb.shapes.add(shape);
        cdt.tds.addTriagVertices(shape.uuid, va, vb);
    }

    addToTriangulation(data: { target: TriangulationTarget; shape: string }): void {
        if (this._state.mode === VisibilityMode.TRIANGLE_ITERATIVE) {
            const shape = UuidMap.get(data.shape);
            if (shape) this.addShapesToTriangulation(data.target, shape);
        }
    }

    private addShapesToTriangulation(target: TriangulationTarget, ...shapes: Shape[]): void {
        // console.time("AS");
        for (const shape of shapes) {
            if (shape.points.length <= 1) continue;
            const j = shape.isClosed ? 0 : 1;
            for (let i = 0; i < shape.points.length - j; i++) {
                const pa = shape.points[i % shape.points.length];
                const pb = shape.points[(i + 1) % shape.points.length];
                this.insertConstraint(target, shape, pa, pb);
            }
        }
        // console.timeEnd("AS");
    }

    deleteFromTriangulation(data: { target: TriangulationTarget; shape: string }): void {
        if (this._state.mode === VisibilityMode.TRIANGLE_ITERATIVE) {
            const shape = UuidMap.get(data.shape);
            if (shape) this.deleteShapesFromTriangulation(data.target, shape);
        }
    }

    private deleteShapesFromTriangulation(target: TriangulationTarget, shape: Shape): void {
        if (shape.points.length <= 1) return;
        new IterativeDelete(target, shape);
    }

    moveShape(shape: Shape, oldFloor: number, newFloor: number): void {
        if (shape.blocksMovement) {
            this.moveBlocker(TriangulationTarget.MOVEMENT, shape.uuid, oldFloor, newFloor, true);
        }
        if (shape.blocksVision) {
            this.moveBlocker(TriangulationTarget.VISION, shape.uuid, oldFloor, newFloor, true);
        }
        this.moveVisionSource(shape.uuid, shape.getAuras(true), oldFloor, newFloor);
    }

    // HELPERS

    getBlockers(target: TriangulationTarget, floor: number): readonly string[] {
        const blockers = target === TriangulationTarget.VISION ? this.visionBlockers : this.movementBlockers;
        return blockers.get(floor) ?? [];
    }

    getVisionSources(floor: number): readonly { shape: string; aura: string }[] {
        return this.visionSources.get(floor) ?? [];
    }

    setVisionSources(sources: { shape: string; aura: string }[], floor: number): void {
        this.visionSources.set(floor, sources);
    }

    setBlockers(target: TriangulationTarget, blockers: string[], floor: number): void {
        const targetBlockers = target === TriangulationTarget.VISION ? this.visionBlockers : this.movementBlockers;
        targetBlockers.set(floor, blockers);
    }

    sliceVisionSources(index: number, floor: number): void {
        const sources = this.getVisionSources(floor);
        this.setVisionSources([...sources.slice(0, index), ...sources.slice(index + 1)], floor);
    }

    sliceBlockers(target: TriangulationTarget, index: number, floor: number, recalculate: boolean): void {
        const blockers = this.getBlockers(target, floor);
        const shape = blockers[index];
        this.setBlockers(target, [...blockers.slice(0, index), ...blockers.slice(index + 1)], floor);
        if (recalculate) {
            this.deleteFromTriangulation({
                target,
                shape,
            });
            this.recalculate({ target, floor });
        }
    }

    addVisionSource(source: { shape: string; aura: string }, floor: number): void {
        const sources = this.getVisionSources(floor);
        this.setVisionSources([...sources, source], floor);
    }

    addBlocker(target: TriangulationTarget, blocker: string, floor: number, recalculate: boolean): void {
        const blockers = this.getBlockers(target, floor);
        this.setBlockers(target, [...blockers, blocker], floor);
        if (recalculate) {
            this.addToTriangulation({ target, shape: blocker });
            this.recalculate({ target, floor });
        }
    }

    moveBlocker(
        target: TriangulationTarget,
        blocker: string,
        oldFloor: number,
        newFloor: number,
        recalculate: boolean,
    ): void {
        this.sliceBlockers(
            target,
            this.getBlockers(target, oldFloor).findIndex((shape) => shape === blocker),
            oldFloor,
            recalculate,
        );
        this.addBlocker(target, blocker, newFloor, recalculate);
    }

    moveVisionSource(source: string, auras: readonly Aura[], oldFloor: number, newFloor: number): void {
        for (const aura of auras) {
            if (!aura.visionSource) continue;
            this.sliceVisionSources(
                this.getVisionSources(oldFloor).findIndex((s) => s.shape === source && s.aura === aura.uuid),
                oldFloor,
            );
            this.addVisionSource({ shape: source, aura: aura.uuid }, newFloor);
        }
    }

    removeBlocker(target: TriangulationTarget, floor: number, shape: Shape, recalculate: boolean): void {
        const blockers = this.getBlockers(target, floor);
        const index = blockers.findIndex((ls) => ls === shape.uuid);
        if (index >= 0) {
            this.sliceBlockers(target, index, floor, recalculate);
        }
    }

    removeBlockers(target: TriangulationTarget, floor: number): void {
        if (target === TriangulationTarget.MOVEMENT) this.movementBlockers.delete(floor);
        else this.visionBlockers.delete(floor);
    }

    removeVisionSources(floor: number, shape: string): boolean {
        const sources = this.getVisionSources(floor);
        const index = sources.findIndex((ls) => ls.shape === shape);
        if (index >= 0) this.sliceVisionSources(index, floor);
        return index >= 0;
    }
}

export const visionState = new VisionState();
(window as any).visionState = visionState;
