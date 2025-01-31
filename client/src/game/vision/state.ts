import { getUnitDistance } from "../../core/conversions";
import { equalsP } from "../../core/geometry";
import type { LocalId } from "../../core/id";
import { Store } from "../../core/store";
import { sendLocationOption } from "../api/emits/location";
import { getShape } from "../id";
import type { IShape } from "../interfaces/shape";
import type { IAsset } from "../interfaces/shapes/asset";
import type { FloorId, LayerName } from "../models/floor";
import { SimpleCircle } from "../shapes/variants/simple/circle";
import { getPaths, pathToArray } from "../svg";
import { accessSystem } from "../systems/access";
import { auraSystem } from "../systems/auras";
import type { Aura, AuraId } from "../systems/auras/models";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { getProperties } from "../systems/properties/state";
import { VisionBlock } from "../systems/properties/types";

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

export function visibilityModeFromString(mode: string): VisibilityMode | undefined {
    if (mode.toUpperCase() === VisibilityMode[VisibilityMode.TRIANGLE]) return VisibilityMode.TRIANGLE;
    else if (mode.toUpperCase() === VisibilityMode[VisibilityMode.TRIANGLE_ITERATIVE])
        return VisibilityMode.TRIANGLE_ITERATIVE;
    return undefined;
}

interface State {
    mode: VisibilityMode;
}

interface VisionSource {
    shape: LocalId;
    aura: AuraId;
    path?: Path2D;
}

class VisionState extends Store<State> {
    private visionBlockers = new Map<FloorId, LocalId[]>();
    private movementBlockers = new Map<FloorId, LocalId[]>();
    private visionSources = new Map<FloorId, { shape: LocalId; aura: AuraId }[]>();

    private visionSourcesInView = new Map<FloorId, { shape: LocalId; aura: AuraId }[]>();
    private visionIteration = new Map<FloorId, number>();

    private cdt = new Map<FloorId, { vision: CDT; movement: CDT }>();

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
        this.visionSourcesInView.clear();
        this.visionIteration.clear();
        this.cdt.clear();
    }

    setVisionMode(mode: VisibilityMode, sync: boolean): void {
        this._state.mode = mode;

        for (const floor of floorState.raw.floors) {
            visionState.recalculateVision(floor.id);
            visionState.recalculateMovement(floor.id);
        }
        floorSystem.invalidateAllFloors();

        if (sync) sendLocationOption("vision_mode", VisibilityMode[mode], undefined);
    }

    recalculate(data: { target: TriangulationTarget; floor: FloorId }): void {
        if (this._state.mode === VisibilityMode.TRIANGLE) this.triangulate(data.target, data.floor);
    }

    recalculateVision(floor: FloorId): void {
        if (this._state.mode === VisibilityMode.TRIANGLE) this.triangulate(TriangulationTarget.VISION, floor);
    }

    recalculateMovement(floor: FloorId): void {
        if (this._state.mode === VisibilityMode.TRIANGLE) this.triangulate(TriangulationTarget.MOVEMENT, floor);
    }

    increaseVisionIteration(floor: FloorId): void {
        const i = this.visionIteration.get(floor)!;
        this.visionIteration.set(floor, i > 1000 ? 0 : i + 1);
    }

    getVisionIteration(floor: FloorId): number {
        return this.visionIteration.get(floor)!;
    }

    // CDT

    addCdt(floor: FloorId): void {
        const vision = new CDT();
        const movement = new CDT();
        this.cdt.set(floor, { vision, movement });
        this.movementBlockers.set(floor, []);
        this.visionBlockers.set(floor, []);
        this.visionSources.set(floor, []);
        this.visionIteration.set(floor, 0);
        this.addWalls(vision);
        this.addWalls(movement);
    }

    getCDT(target: TriangulationTarget, floor: FloorId): CDT {
        return this.cdt.get(floor)![target];
    }

    setCDT(target: TriangulationTarget, floor: FloorId, cdt: CDT): void {
        this.cdt.set(floor, { ...this.cdt.get(floor)!, [target]: cdt });
    }

    removeCdt(floor: FloorId): void {
        this.cdt.delete(floor);
    }

    // TRIANGULATION

    private triangulate(target: TriangulationTarget, floor: FloorId): void {
        const cdt = new CDT();
        this.setCDT(target, floor, cdt);
        const shapes = this.getBlockers(target, floor);

        for (const sh of shapes) {
            const shape = getShape(sh);
            if (shape === undefined || shape.floorId !== floor) continue;

            this.triangulateShape(target, shape);
        }
        this.addWalls(cdt);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (window as any).CDT = this.cdt;

        if (target === TriangulationTarget.VISION) this.increaseVisionIteration(floor);
    }

    private triangulateShape(target: TriangulationTarget, shape: IShape): void {
        const points = shape.shadowPoints;
        if (points.length === 0) return;
        if (shape.type === "assetrect") {
            const asset = shape as IAsset;
            if (shape.options.svgAsset !== undefined && asset.svgData !== undefined) {
                for (const svgData of asset.svgData) {
                    if (!equalsP(shape.refPoint, svgData.rp) || svgData.paths === undefined) {
                        const w = asset.w;
                        const h = asset.h;

                        const svg = svgData.svg as SVGSVGElement;

                        const dW = w / (svg.width.animVal.valueInSpecifiedUnits ?? 1);
                        const dH = h / (svg.height.animVal.valueInSpecifiedUnits ?? 1);

                        svgData.paths = [...getPaths(asset, svg, dW, dH)];
                    }
                    for (const paths of svgData.paths) {
                        for (const path of paths) {
                            this.triangulatePath(target, shape, path, false);
                        }
                    }
                }
                return;
            } else if (shape.options.svgPaths !== undefined) {
                for (const pathString of shape.options.svgPaths) {
                    const w = asset.w;
                    const h = asset.h;

                    const dW = w / (shape.options.svgWidth ?? 1);
                    const dH = h / (shape.options.svgHeight ?? 1);

                    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    pathElement.setAttribute("d", pathString);
                    const paths = pathToArray(shape as IAsset, pathElement, dW, dH);
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

    private triangulatePath(
        target: TriangulationTarget,
        shape: IShape,
        path: [number, number][],
        closed: boolean,
    ): void {
        const j = closed ? 0 : 1;
        for (let i = 0; i < path.length - j; i++) {
            const pa = path[i]!.map((n) => parseFloat(n.toFixed(10))) as [number, number];
            const pb = path[(i + 1) % path.length]!.map((n) => parseFloat(n.toFixed(10))) as [number, number];
            this.insertConstraint(target, shape, pa, pb);
        }
    }

    insertConstraint(target: TriangulationTarget, shape: IShape, pa: [number, number], pb: [number, number]): void {
        if (shape.floorId !== undefined) {
            const cdt = this.getCDT(target, shape.floorId);
            const { va, vb } = cdt.insertConstraint(pa, pb);
            va.shapes.add(shape.id);
            vb.shapes.add(shape.id);
            cdt.tds.addTriagVertices(shape.id, va, vb);
        }
    }

    addToTriangulation(data: { target: TriangulationTarget; shape: LocalId }): void {
        if (this._state.mode === VisibilityMode.TRIANGLE_ITERATIVE) {
            const shape = getShape(data.shape);
            if (shape) {
                this.triangulateShape(data.target, shape);
                if (data.target === TriangulationTarget.VISION) {
                    if (shape.floorId !== undefined) this.increaseVisionIteration(shape.floorId);
                }
            }
        }
    }

    deleteFromTriangulation(data: { target: TriangulationTarget; shape: LocalId }): void {
        if (this._state.mode === VisibilityMode.TRIANGLE_ITERATIVE) {
            const shape = getShape(data.shape);
            if (shape) {
                this.deleteShapesFromTriangulation(data.target, shape);
                if (data.target === TriangulationTarget.VISION) {
                    if (shape.floorId !== undefined) this.increaseVisionIteration(shape.floorId);
                }
            }
        }
    }

    private deleteShapesFromTriangulation(target: TriangulationTarget, shape: IShape): void {
        if (shape.points.length <= 1) return;
        new IterativeDelete(target, shape);
    }

    moveShape(id: LocalId, oldFloor: FloorId, newFloor: FloorId): void {
        const props = getProperties(id)!;
        if (props.blocksMovement) {
            this.moveBlocker(TriangulationTarget.MOVEMENT, id, oldFloor, newFloor, true);
        }
        if (props.blocksVision !== VisionBlock.No) {
            this.moveBlocker(TriangulationTarget.VISION, id, oldFloor, newFloor, true);
        }
        this.moveVisionSource(id, auraSystem.getAll(id, true), oldFloor, newFloor);
    }

    // HELPERS

    getBlockers(target: TriangulationTarget, floor: FloorId): readonly LocalId[] {
        const blockers = target === TriangulationTarget.VISION ? this.visionBlockers : this.movementBlockers;
        return blockers.get(floor) ?? [];
    }

    getVisionSourcesInView(floor: FloorId): readonly VisionSource[] {
        return this.visionSourcesInView.get(floor) ?? [];
    }

    updateSourcesInSector(floor: FloorId, layer: LayerName, shapeIds: Set<LocalId>): void {
        let sources = this.visionSourcesInView.get(floor);
        if (sources === undefined) {
            sources = [];
            this.visionSourcesInView.set(floor, sources);
        }
        const found = new Set<LocalId>();
        // 1. Wipe all layer sources no longer in view
        for (let i = sources.length - 1; i >= 0; i--) {
            const source = sources[i]!;
            const shape = getShape(source.shape);
            if (shape === undefined) continue;
            if (shape.layerName === layer) {
                if (shapeIds.has(shape.id)) {
                    found.add(shape.id);
                } else {
                    sources.splice(i, 1);
                }
            }
        }
        // 2. Add layer sources new to view
        for (const source of this.visionSources.get(floor)!) {
            if (found.has(source.shape)) continue;
            if (shapeIds.has(source.shape)) sources.push(source);
        }
    }

    // todo: to be removed, but it's no longer on the hot path currently so not priority
    invalidateView(floor: FloorId): void {
        const layer = floorState.currentLayer.value;
        if (layer === undefined) return;
        const viv = [];
        for (const source of this.getVisionSources(floor)) {
            const aura = auraSystem.get(source.shape, source.aura, true);
            if (aura === undefined) continue;

            if (!accessSystem.hasAccessTo(source.shape, true, { vision: true }) && !aura.visible) continue;

            const auraValue = aura.value > 0 && !isNaN(aura.value) ? aura.value : 0;
            const auraDim = aura.dim > 0 && !isNaN(aura.dim) ? aura.dim : 0;

            const shape = getShape(source.shape);
            if (shape === undefined) continue;

            const auraLength = getUnitDistance(auraValue + auraDim);
            const center = shape.center;

            const auraCircle = new SimpleCircle(center, auraLength);
            if (auraCircle.visibleInCanvas({ w: layer.width, h: layer.height })) {
                viv.push(source);
            }
        }
        this.visionSourcesInView.set(floor, viv);
    }

    getAllVisionSources(): readonly { shape: LocalId; aura: AuraId }[] {
        return [...this.visionSources.values()].flat();
    }

    private getVisionSources(floor: FloorId): readonly { shape: LocalId; aura: AuraId }[] {
        return this.visionSources.get(floor) ?? [];
    }

    private setVisionSources(sources: { shape: LocalId; aura: AuraId }[], floor: FloorId): void {
        this.visionSources.set(floor, sources);
        this.invalidateView(floor);
    }

    private setBlockers(target: TriangulationTarget, blockers: LocalId[], floor: FloorId): void {
        const targetBlockers = target === TriangulationTarget.VISION ? this.visionBlockers : this.movementBlockers;
        targetBlockers.set(floor, blockers);
    }

    sliceVisionSources(index: number, floor: FloorId): void {
        const sources = this.getVisionSources(floor);
        this.setVisionSources([...sources.slice(0, index), ...sources.slice(index + 1)], floor);
    }

    sliceBlockers(target: TriangulationTarget, index: number, floor: FloorId, recalculate: boolean): void {
        const blockers = this.getBlockers(target, floor);
        const shape = blockers[index];
        if (shape === undefined) {
            console.error("Failed to find blocker shape while slicing.");
            return;
        }

        this.setBlockers(target, [...blockers.slice(0, index), ...blockers.slice(index + 1)], floor);
        if (recalculate) {
            this.deleteFromTriangulation({
                target,
                shape,
            });
            this.recalculate({ target, floor });
        }
    }

    addVisionSource(source: { shape: LocalId; aura: AuraId }, floor: FloorId): void {
        const sources = this.getVisionSources(floor);
        this.setVisionSources([...sources, source], floor);
    }

    addBlocker(target: TriangulationTarget, blocker: LocalId, floor: FloorId, recalculate: boolean): void {
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
        oldFloor: FloorId,
        newFloor: FloorId,
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

    moveVisionSource(source: LocalId, auras: readonly Aura[], oldFloor: FloorId, newFloor: FloorId): void {
        for (const aura of auras) {
            if (!aura.visionSource) continue;
            this.sliceVisionSources(
                this.getVisionSources(oldFloor).findIndex((s) => s.shape === source && s.aura === aura.uuid),
                oldFloor,
            );
            this.addVisionSource({ shape: source, aura: aura.uuid }, newFloor);
        }
    }

    removeBlocker(target: TriangulationTarget, floor: FloorId, shape: IShape, recalculate: boolean): void {
        const blockers = this.getBlockers(target, floor);
        const index = blockers.findIndex((ls) => ls === shape.id);
        if (index >= 0) {
            this.sliceBlockers(target, index, floor, recalculate);
        }
    }

    removeBlockers(target: TriangulationTarget, floor: FloorId): void {
        if (target === TriangulationTarget.MOVEMENT) this.movementBlockers.delete(floor);
        else this.visionBlockers.delete(floor);
    }

    removeVisionSource(floor: FloorId, aura: AuraId): void {
        const sources = this.getVisionSources(floor);
        const newSources = sources.filter((s) => s.aura !== aura);
        if (newSources.length !== sources.length) {
            this.setVisionSources(newSources, floor);
        }
    }

    removeVisionSources(floor: FloorId, shape: LocalId): void {
        const sources = this.getVisionSources(floor);
        const newSources = sources.filter((s) => s.shape !== shape);
        if (newSources.length !== sources.length) {
            this.setVisionSources(newSources, floor);
        }
    }
}

export const visionState = new VisionState();
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).visionState = visionState;
