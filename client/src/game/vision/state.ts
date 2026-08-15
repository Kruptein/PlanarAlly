import { getUnitDistance } from "../../core/conversions";
import type { LocalPoint } from "../../core/geometry";
import { equalsP, toGP } from "../../core/geometry";
import type { LocalId } from "../../core/id";
import { Store } from "../../core/store";
import { sendLocationOption } from "../api/emits/location";
import { getShape } from "../id";
import type { IShape } from "../interfaces/shape";
import type { IAsset } from "../interfaces/shapes/asset";
import type { FloorId } from "../models/floor";
import { LayerName } from "../models/floor";
import { SimpleCircle } from "../shapes/variants/simple/circle";
import { getPaths, pathToArray } from "../svg";
import { accessSystem } from "../systems/access";
import { auraSystem } from "../systems/auras";
import type { Aura, AuraId } from "../systems/auras/models";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { doorSystem } from "../systems/logic/door";
import { getProperties } from "../systems/properties/state";
import { VisionBlock } from "../systems/properties/types";

import { CDT } from "./cdt";
import { IterativeDelete } from "./iterative";
import type { Point, Triangle, Vertex } from "./tds";
import { computeVisibility } from "./te";
import { ccw, cw } from "./triag";

export enum TriangulationTarget {
    VISION = "vision",
    MOVEMENT = "movement",
}

export enum VisibilityMode {
    TRIANGLE,
    TRIANGLE_ITERATIVE,
}

export type BehindPatch = { points: Point[]; entrance: [Point, Point] };

export function visibilityModeFromString(mode: string): VisibilityMode | undefined {
    if (mode.toUpperCase() === VisibilityMode[VisibilityMode.TRIANGLE]) return VisibilityMode.TRIANGLE;
    else if (mode.toUpperCase() === VisibilityMode[VisibilityMode.TRIANGLE_ITERATIVE])
        return VisibilityMode.TRIANGLE_ITERATIVE;
    return undefined;
}

export const PORTAL_RANGE = 400;

interface State {
    mode: VisibilityMode;
}

interface VisionSource {
    shape: LocalId;
    aura: AuraId;
    isFloodLight: boolean;
    path?: Path2D;
}

export const AMBIENT_SYMBOL = Symbol("ambient");

class VisionState extends Store<State> {
    private readonly visionBlockers = new Map<FloorId, LocalId[]>();
    private readonly movementBlockers = new Map<FloorId, LocalId[]>();
    private readonly visionSources = new Map<FloorId, VisionSource[]>();

    private readonly visionSourcesInView = new Map<FloorId, VisionSource[]>();
    private readonly visionIteration = new Map<FloorId, number>();

    private readonly cdt = new Map<FloorId, { vision: CDT; movement: CDT }>();
    private readonly interiorDependentShapes = new Map<FloorId, Set<LocalId | typeof AMBIENT_SYMBOL>>();
    private readonly interiorPaths = new Map<FloorId, Map<LocalId | typeof AMBIENT_SYMBOL, Path2D>>();
    private readonly portalPaths = new Map<
        FloorId,
        Map<LocalId | typeof AMBIENT_SYMBOL, { path: Path2D; cx: number; cy: number }[]>
    >();
    private readonly ambientBarrierShapes = new Map<FloorId, LocalId[]>();

    drawTeContour = false;

    protected data(): State {
        return {
            mode: VisibilityMode.TRIANGLE,
        };
    }

    behindVisionLightPaths = new Map<LocalId, Point[][]>();

    clear(): void {
        this.visionBlockers.clear();
        this.movementBlockers.clear();
        this.visionSources.clear();
        this.visionSourcesInView.clear();
        this.visionIteration.clear();
        this.cdt.clear();
        this.interiorDependentShapes.clear();
        this.interiorPaths.clear();
        this.portalPaths.clear();
        this.ambientBarrierShapes.clear();
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

        this.interiorDependentShapes.set(floor, new Set([AMBIENT_SYMBOL]));
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

        if (target === TriangulationTarget.VISION) {
            this.recalcInterior(floor);
        }
    }

    private triangulateShape(target: TriangulationTarget, shape: IShape): void {
        const isBehindShape = shape.isClosed && getProperties(shape.id)?.blocksVision === VisionBlock.Behind;
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
                            this.triangulatePath(target, shape, path, false, isBehindShape);
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
                        this.triangulatePath(target, shape, path, false, isBehindShape);
                        break;
                    }
                }
                return;
            }
        }
        this.triangulatePath(target, shape, points, shape.isClosed, isBehindShape);
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

    getInteriorPath(floor: FloorId, shape: LocalId | typeof AMBIENT_SYMBOL): Path2D | undefined {
        return this.interiorPaths.get(floor)?.get(shape);
    }

    private recalcInterior(floor: FloorId): void {
        for (const shape of this.interiorDependentShapes.get(floor) ?? []) this.computeInteriorRegions(floor, shape);
        this.increaseVisionIteration(floor);
    }

    getPortalMasks(floor: FloorId, shape: LocalId | typeof AMBIENT_SYMBOL): { path: Path2D; cx: number; cy: number }[] {
        return this.portalPaths.get(floor)?.get(shape) ?? [];
    }

    addAmbientBarrier(id: LocalId, floor: FloorId): void {
        const barriers = this.ambientBarrierShapes.get(floor) ?? [];
        barriers.push(id);
        this.ambientBarrierShapes.set(floor, barriers);
        this.recalcInterior(floor);
        floorSystem.invalidateAllFloors();
    }

    removeAmbientBarrier(id: LocalId, floor: FloorId): void {
        const barriers = this.ambientBarrierShapes.get(floor);
        if (barriers !== undefined) {
            const idx = barriers.indexOf(id);
            if (idx >= 0) barriers.splice(idx, 1);
        }
        this.recalcInterior(floor);
        floorSystem.invalidateAllFloors();
    }

    private isBoundaryConstraint(t: Triangle, edgeIdx: number): boolean {
        const BOUNDARY = 1e7;
        const v1 = t.vertices[ccw(edgeIdx)]?.point;
        const v2 = t.vertices[cw(edgeIdx)]?.point;
        if (v1 === undefined || v2 === undefined) return true;
        return (
            (Math.abs(v1[0]) >= BOUNDARY || Math.abs(v1[1]) >= BOUNDARY) &&
            (Math.abs(v2[0]) >= BOUNDARY || Math.abs(v2[1]) >= BOUNDARY)
        );
    }

    private collectAmbientBarriers(floor: FloorId): { segments: [Point, Point][]; center: Point }[] {
        const sources: { segments: [Point, Point][]; center: Point }[] = [];

        const addShapeBarrier = (shape: IShape): void => {
            const points = shape.shadowPoints;
            if (points.length < 2) return;
            const segments: [Point, Point][] = [];
            const n = points.length;
            const closed = shape.isClosed;
            for (let i = 0; i < n - (closed ? 0 : 1); i++) {
                const pa: Point = [
                    Number.parseFloat(points[i]![0].toFixed(10)),
                    Number.parseFloat(points[i]![1].toFixed(10)),
                ];
                const pb: Point = [
                    Number.parseFloat(points[(i + 1) % n]![0].toFixed(10)),
                    Number.parseFloat(points[(i + 1) % n]![1].toFixed(10)),
                ];
                segments.push([pa, pb]);
            }
            const c = shape.center;
            sources.push({ segments, center: [c.x, c.y] });
        };

        // Open doors act as ambient barriers even though their CDT constraints are removed
        for (const doorId of doorSystem.getDoors()) {
            const shape = getShape(doorId);
            if (shape?.floorId !== floor) continue;
            const props = getProperties(doorId);
            if (props?.blocksVision !== VisionBlock.No) continue;
            addShapeBarrier(shape);
        }

        // Manual ambient barrier shapes
        for (const barrierId of this.ambientBarrierShapes.get(floor) ?? []) {
            const shape = getShape(barrierId);
            if (shape === undefined) continue;
            addShapeBarrier(shape);
        }

        return sources;
    }

    private computeInteriorRegions(floor: FloorId, shapeId: LocalId | typeof AMBIENT_SYMBOL): void {
        const cdt = this.getCDT(TriangulationTarget.VISION, floor);
        const barrierSources = this.collectAmbientBarriers(floor);

        const allBarrierSegments = barrierSources.flatMap((s) => s.segments);
        const insertedBarriers = cdt.insertBarrierEdges(allBarrierSegments);

        const barrierAdj = new Map<Vertex, Set<Vertex>>();
        for (const [va, vb] of insertedBarriers) {
            if (!barrierAdj.has(va)) barrierAdj.set(va, new Set());
            barrierAdj.get(va)!.add(vb);
            if (!barrierAdj.has(vb)) barrierAdj.set(vb, new Set());
            barrierAdj.get(vb)!.add(va);
        }

        const exterior = new Set<Triangle>();
        const queue: Triangle[] = [];
        if (shapeId === AMBIENT_SYMBOL) {
            for (const t of cdt.tds.triangles) {
                if (t.isInfinite()) {
                    exterior.add(t);
                    queue.push(t);
                }
            }
        } else {
            const shape = getShape(shapeId);
            if (shape === undefined) return;
            const triangle = cdt.locate([shape.center.x, shape.center.y], null);
            if (triangle.loc !== null) {
                exterior.add(triangle.loc);
                queue.push(triangle.loc);
            }
        }

        while (queue.length > 0) {
            const current = queue.pop()!;
            for (let i = 0; i < 3; i++) {
                if (current.isConstrained(i) && !this.isBoundaryConstraint(current, i)) {
                    continue;
                }
                if (barrierAdj.size > 0) {
                    const va = current.vertices[ccw(i)];
                    const vb = current.vertices[cw(i)];
                    if (va && vb && barrierAdj.get(va)?.has(vb) === true) {
                        continue;
                    }
                }
                const neighbour = current.neighbours[i] ?? null;
                if (neighbour === null || exterior.has(neighbour)) continue;
                exterior.add(neighbour);
                queue.push(neighbour);
            }
        }

        if (!this.portalPaths.has(floor)) this.portalPaths.set(floor, new Map());
        const cachedPaths: { path: Path2D; cx: number; cy: number }[] = [];
        for (const source of barrierSources) {
            const locResult = cdt.locate(source.center, null);
            const tri = locResult.loc;
            if (tri === null) continue;

            if (!exterior.has(tri)) {
                let bordersExterior = false;
                for (let i = 0; i < 3; i++) {
                    const n = tri.neighbours[i];
                    if (n != null && exterior.has(n)) {
                        bordersExterior = true;
                        break;
                    }
                }
                if (!bordersExterior) continue;
            }

            const mid = toGP(source.center[0], source.center[1]);
            const { visibility } = computeVisibility(mid, TriangulationTarget.VISION, floor, false, PORTAL_RANGE);
            if (visibility.length < 3) continue;

            const path = new Path2D();
            path.moveTo(visibility[0]![0], visibility[0]![1]);
            for (let i = 1; i < visibility.length; i++) {
                path.lineTo(visibility[i]![0], visibility[i]![1]);
            }
            path.closePath();
            cachedPaths.push({ path, cx: source.center[0], cy: source.center[1] });
        }
        this.portalPaths.get(floor)!.set(shapeId, cachedPaths);

        const interior = new Set<Triangle>();
        for (const t of cdt.tds.triangles) {
            if (!t.isInfinite() && !exterior.has(t)) {
                interior.add(t);
            }
        }
        if (!this.interiorDependentShapes.has(floor)) this.interiorDependentShapes.set(floor, new Set());
        this.interiorDependentShapes.get(floor)!.add(shapeId);

        if (!this.interiorPaths.has(floor)) this.interiorPaths.set(floor, new Map());
        if (interior.size > 0) {
            const path = new Path2D();
            for (const t of interior) {
                const v0 = t.vertices[0]!.point!;
                const v1 = t.vertices[1]!.point!;
                const v2 = t.vertices[2]!.point!;
                path.moveTo(v0[0], v0[1]);
                path.lineTo(v1[0], v1[1]);
                path.lineTo(v2[0], v2[1]);
                path.closePath();
            }
            this.interiorPaths.get(floor)!.set(shapeId, path);
        } else {
            this.interiorPaths.get(floor)!.delete(shapeId);
        }
    }

    private triangulatePath(
        target: TriangulationTarget,
        shape: IShape,
        path: [number, number][],
        closed: boolean,
        isBehindShape: boolean,
    ): void {
        const j = closed ? 0 : 1;
        for (let i = 0; i < path.length - j; i++) {
            const pa = path[i]!.map((n) => parseFloat(n.toFixed(10))) as [number, number];
            const pb = path[(i + 1) % path.length]!.map((n) => parseFloat(n.toFixed(10))) as [number, number];
            this.insertConstraint(target, shape, pa, pb, isBehindShape);
        }
    }

    insertConstraint(
        target: TriangulationTarget,
        shape: IShape,
        pa: [number, number],
        pb: [number, number],
        isBehindShape: boolean,
    ): void {
        if (shape.floorId !== undefined) {
            const cdt = this.getCDT(target, shape.floorId);
            const { va, vb } = cdt.insertConstraint(pa, pb);
            if (isBehindShape) {
                va.shapes.add(shape.id);
                vb.shapes.add(shape.id);
            }
            cdt.tds.addTriagVertices(shape.id, va, vb);
        }
    }

    addToTriangulation(data: { target: TriangulationTarget; shape: LocalId }): void {
        if (this._state.mode === VisibilityMode.TRIANGLE_ITERATIVE) {
            const shape = getShape(data.shape);
            if (shape) {
                this.triangulateShape(data.target, shape);
                if (data.target === TriangulationTarget.VISION) {
                    if (shape.floorId !== undefined) {
                        this.recalcInterior(shape.floorId);
                    }
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
                    if (shape.floorId !== undefined) {
                        this.recalcInterior(shape.floorId);
                    }
                }
            }
        }
    }

    private deleteShapesFromTriangulation(target: TriangulationTarget, shape: IShape): void {
        if (shape.points.length <= 1) return;
        // oxlint-disable-next-line no-new
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
        this.moveVisionSource(id, auraSystem.getAll(id), oldFloor, newFloor);
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
        // We keep track of a moving write index, moving sources we need to keep to the current write index
        // and at the end truncating the length of the array to retain the correct size.
        // This ensures that we iterate exactly once over the array.
        let writeIndex = 0;
        for (let i = 0; i < sources.length; i++) {
            const source = sources[i]!;
            const shape = getShape(source.shape);
            if (shape !== undefined && shape.layerName === layer) {
                if (source.isFloodLight || shapeIds.has(shape.id)) {
                    found.add(shape.id);
                    sources[writeIndex++] = source;
                }
            } else {
                if (source.isFloodLight) found.add(source.shape);
                sources[writeIndex++] = source;
            }
        }
        sources.length = writeIndex;
        // 2. Add layer sources new to view
        for (const source of this.visionSources.get(floor)!) {
            if (found.has(source.shape)) continue;
            if (source.isFloodLight || shapeIds.has(source.shape)) sources.push(source);
        }
    }

    addShapeToSourcesInView(floor: FloorId, shapeId: LocalId): void {
        const sources = this.visionSourcesInView.get(floor);
        if (sources === undefined) return;
        for (const source of this.visionSources.get(floor) ?? []) {
            if (source.shape === shapeId) sources.push(source);
        }
    }

    removeShapeFromSourcesInView(floor: FloorId, shapeId: LocalId): void {
        const sources = this.visionSourcesInView.get(floor);
        if (sources === undefined) return;
        let write = 0;
        for (let i = 0; i < sources.length; i++) {
            if (sources[i]!.shape !== shapeId) {
                sources[write++] = sources[i]!;
            }
        }
        sources.length = write;
    }

    // todo: to be removed, but it's no longer on the hot path currently so not priority
    invalidateView(floor: FloorId): void {
        const layer = floorState.currentLayer.value;
        const viv = [];
        for (const source of this.getVisionSources(floor)) {
            const aura = auraSystem.get(source.shape, source.aura);
            if (aura === undefined) continue;

            if (!accessSystem.hasAccessTo(source.shape, "vision", true) && !aura.visible) continue;

            if (layer === undefined) {
                viv.push(source);
                continue;
            }

            const auraValue = aura.value > 0 && !isNaN(aura.value) ? aura.value : 0;
            const auraDim = aura.dim > 0 && !isNaN(aura.dim) ? aura.dim : 0;

            const shape = getShape(source.shape);
            if (shape === undefined) continue;

            const auraLength = getUnitDistance(auraValue + auraDim);
            const center = shape.center;

            if (source.isFloodLight) {
                viv.push(source);
                continue;
            }

            const auraCircle = new SimpleCircle(center, auraLength);
            if (auraCircle.visibleInCanvas({ w: layer.width, h: layer.height })) {
                viv.push(source);
            }
        }
        this.visionSourcesInView.set(floor, viv);
    }

    getAllVisionSources(): readonly VisionSource[] {
        return [...this.visionSources.values()].flat();
    }

    private getVisionSources(floor: FloorId): readonly VisionSource[] {
        return this.visionSources.get(floor) ?? [];
    }

    private setVisionSources(sources: VisionSource[], floor: FloorId): void {
        this.visionSources.set(floor, sources);
        this.invalidateView(floor);
    }

    private setBlockers(target: TriangulationTarget, blockers: LocalId[], floor: FloorId): void {
        const targetBlockers = target === TriangulationTarget.VISION ? this.visionBlockers : this.movementBlockers;
        targetBlockers.set(floor, blockers);
    }

    private sliceVisionSources(index: number, floor: FloorId): void {
        const sources = this.getVisionSources(floor);
        const source = sources[index]!;
        if (source.isFloodLight) {
            this.interiorDependentShapes.get(floor)?.delete(source.shape);
            this.interiorPaths.get(floor)?.delete(source.shape);
        }
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

    addVisionSource(source: VisionSource, floor: FloorId): void {
        const sources = this.getVisionSources(floor);
        this.setVisionSources([...sources, source], floor);
        if (source.isFloodLight) {
            if (!this.interiorDependentShapes.has(floor)) {
                this.interiorDependentShapes.set(floor, new Set());
            }
            this.interiorDependentShapes.get(floor)!.add(source.shape);
            this.computeInteriorRegions(floor, source.shape);
        }
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
            if (!aura.active || !aura.visionSource) continue;
            const index = this.getVisionSources(oldFloor).findIndex((s) => s.shape === source && s.aura === aura.uuid);
            if (index === -1) {
                console.error("Failed to find vision source in old floor - skipping.");
                continue;
            }
            this.sliceVisionSources(index, oldFloor);
            this.addVisionSource({ shape: source, aura: aura.uuid, isFloodLight: aura.floodLight }, newFloor);
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
        const source = sources.find((s) => s.aura === aura);
        if (source === undefined) return;
        const newSources = sources.filter((s) => s.aura !== aura);
        if (newSources.length !== sources.length) {
            this.setVisionSources(newSources, floor);
        }
        if (source.isFloodLight) {
            this.interiorDependentShapes.get(floor)?.delete(source.shape);
            this.interiorPaths.get(floor)?.delete(source.shape);
        }
    }

    removeVisionSources(floor: FloorId, shape: LocalId): void {
        const sources = this.getVisionSources(floor);
        const newSources = sources.filter((s) => s.shape !== shape);
        if (newSources.length !== sources.length) {
            this.setVisionSources(newSources, floor);
        }
    }

    /**
     * Check if the given point is visible in the given canvas context.
     * If no context is provided, the current floor's lighting layer will be used.
     *
     * A point is considered visible if the alpha channel of the image data is less than 255.
     *
     * We use the lighting layer as that is the actual layer being rendered to the screen.
     * The vision layer is copied onto it and is only relevant in LoS mode.
     * So by using lighting we capture the real visibility and also cover cases where LoS is disabled.
     * If at any point a Vision layer ctx were to be passed, the check should use > 0 instead.
     */
    isInVision(location: LocalPoint, ctx?: CanvasRenderingContext2D): boolean {
        if (ctx === undefined) {
            const floor = floorState.currentFloor.value;
            if (floor === undefined) return false;
            ctx = floorSystem.getLayer(floor, LayerName.Lighting)?.ctx;
            if (ctx === undefined) return false;
        }
        const data = ctx.getImageData(location.x, location.y, 1, 1).data;
        return (data[3] ?? 255) < 255;
    }
}

export const visionState = new VisionState();
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).visionState = visionState;
