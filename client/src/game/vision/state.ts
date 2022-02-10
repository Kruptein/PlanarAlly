import { equalsP } from "../../core/geometry";
import { Store } from "../../core/store";
import { floorStore } from "../../store/floor";
import { IdMap } from "../../store/shapeMap";
import { sendLocationOptions } from "../api/emits/location";
import type { Aura, IShape } from "../shapes/interfaces";
import type { LocalId } from "../shapes/localId";
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
    private visionBlockers: Map<number, LocalId[]> = new Map();
    private movementBlockers: Map<number, LocalId[]> = new Map();
    private visionSources: Map<number, { shape: LocalId; aura: string }[]> = new Map();

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
        const vision = new CDT();
        const movement = new CDT();
        this.cdt.set(floor, { vision, movement });
        this.movementBlockers.set(floor, []);
        this.visionBlockers.set(floor, []);
        this.visionSources.set(floor, []);
        this.addWalls(vision);
        this.addWalls(movement);
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
            const shape = IdMap.get(sh)!;
            if (shape.floor.id !== floor) continue;

            this.triangulateShape(target, shape);
        }
        this.addWalls(cdt);
        (window as any).CDT = this.cdt;
    }

    private triangulateShape(target: TriangulationTarget, shape: IShape): void {
        const points = shape.points; // expensive call
        if (points.length === 0) return;
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
                return;
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
                return;
            }
        }
        this.triangulatePath(target, shape, points, shape.isClosed);
    }

    private addWalls(cdt: CDT): void {
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
    }

    private triangulatePath(target: TriangulationTarget, shape: IShape, path: number[][], closed: boolean): void {
        const j = closed ? 0 : 1;
        for (let i = 0; i < path.length - j; i++) {
            const pa = path[i].map((n) => parseFloat(n.toFixed(10)));
            const pb = path[(i + 1) % path.length].map((n) => parseFloat(n.toFixed(10)));
            this.insertConstraint(target, shape, pa, pb);
        }
    }

    insertConstraint(target: TriangulationTarget, shape: IShape, pa: number[], pb: number[]): void {
        const cdt = this.getCDT(target, shape.floor.id);
        const { va, vb } = cdt.insertConstraint(pa, pb);
        va.shapes.add(shape);
        vb.shapes.add(shape);
        cdt.tds.addTriagVertices(shape.uuid, va, vb);
    }

    addToTriangulation(data: { target: TriangulationTarget; shape: LocalId }): void {
        if (this._state.mode === VisibilityMode.TRIANGLE_ITERATIVE) {
            const shape = IdMap.get(data.shape);
            if (shape) this.triangulateShape(data.target, shape);
        }
    }

    deleteFromTriangulation(data: { target: TriangulationTarget; shape: LocalId }): void {
        if (this._state.mode === VisibilityMode.TRIANGLE_ITERATIVE) {
            const shape = IdMap.get(data.shape);
            if (shape) this.deleteShapesFromTriangulation(data.target, shape);
        }
    }

    private deleteShapesFromTriangulation(target: TriangulationTarget, shape: IShape): void {
        if (shape.points.length <= 1) return;
        new IterativeDelete(target, shape);
    }

    moveShape(shape: IShape, oldFloor: number, newFloor: number): void {
        if (shape.blocksMovement) {
            this.moveBlocker(TriangulationTarget.MOVEMENT, shape.id, oldFloor, newFloor, true);
        }
        if (shape.blocksVision) {
            this.moveBlocker(TriangulationTarget.VISION, shape.id, oldFloor, newFloor, true);
        }
        this.moveVisionSource(shape.id, shape.getAuras(true), oldFloor, newFloor);
    }

    // HELPERS

    getBlockers(target: TriangulationTarget, floor: number): readonly LocalId[] {
        const blockers = target === TriangulationTarget.VISION ? this.visionBlockers : this.movementBlockers;
        return blockers.get(floor) ?? [];
    }

    getVisionSources(floor: number): readonly { shape: LocalId; aura: string }[] {
        return this.visionSources.get(floor) ?? [];
    }

    setVisionSources(sources: { shape: LocalId; aura: string }[], floor: number): void {
        this.visionSources.set(floor, sources);
    }

    setBlockers(target: TriangulationTarget, blockers: LocalId[], floor: number): void {
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

    addVisionSource(source: { shape: LocalId; aura: string }, floor: number): void {
        const sources = this.getVisionSources(floor);
        this.setVisionSources([...sources, source], floor);
    }

    addBlocker(target: TriangulationTarget, blocker: LocalId, floor: number, recalculate: boolean): void {
        const blockers = this.getBlockers(target, floor);
        this.setBlockers(target, [...blockers, blocker], floor);
        if (recalculate) {
            this.addToTriangulation({ target, shape: blocker });
            this.recalculate({ target, floor });
        }
    }

    moveBlocker(
        target: TriangulationTarget,
        blocker: LocalId,
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

    moveVisionSource(source: LocalId, auras: readonly Aura[], oldFloor: number, newFloor: number): void {
        for (const aura of auras) {
            if (!aura.visionSource) continue;
            this.sliceVisionSources(
                this.getVisionSources(oldFloor).findIndex((s) => s.shape === source && s.aura === aura.uuid),
                oldFloor,
            );
            this.addVisionSource({ shape: source, aura: aura.uuid }, newFloor);
        }
    }

    removeBlocker(target: TriangulationTarget, floor: number, shape: IShape, recalculate: boolean): void {
        const blockers = this.getBlockers(target, floor);
        const index = blockers.findIndex((ls) => ls === shape.id);
        if (index >= 0) {
            this.sliceBlockers(target, index, floor, recalculate);
        }
    }

    removeBlockers(target: TriangulationTarget, floor: number): void {
        if (target === TriangulationTarget.MOVEMENT) this.movementBlockers.delete(floor);
        else this.visionBlockers.delete(floor);
    }

    removeVisionSources(floor: number, shape: LocalId): void {
        const sources = this.getVisionSources(floor);
        const newSources = sources.filter((s) => s.shape !== shape);
        if (newSources.length !== sources.length) {
            this.setVisionSources(newSources, floor);
        }
    }
}

export const visionState = new VisionState();
(window as any).visionState = visionState;
