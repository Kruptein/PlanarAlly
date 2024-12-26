import { toRaw } from "vue";

import type { ApiShape } from "../../../apiTypes";
import { g2l, l2g, l2gz } from "../../../core/conversions";
import { Ray, cloneP, toLP } from "../../../core/geometry";
import type { LocalId } from "../../../core/id";
import { filter } from "../../../core/iter";
import { InvalidationMode, SyncMode, UI_SYNC } from "../../../core/models/types";
import { callbackProvider } from "../../../core/utils";
import { debugLayers } from "../../../localStorageHelpers";
import { activeShapeStore } from "../../../store/activeShape";
import { sendRemoveShapes, sendShapeAdd, sendShapeOrder } from "../../api/emits/shape/core";
import { dropId, getGlobalId, getShape } from "../../id";
import type { ILayer } from "../../interfaces/layer";
import type { IShape } from "../../interfaces/shape";
import { LayerName } from "../../models/floor";
import type { FloorId } from "../../models/floor";
import { addOperation } from "../../operations/undo";
import { drawAuras } from "../../rendering/auras";
import { drawTear } from "../../rendering/basic";
import { drawCells } from "../../rendering/grid";
import { createShapeFromDict } from "../../shapes/create";
import { BoundingRect } from "../../shapes/variants/simple/boundingRect";
import { accessSystem } from "../../systems/access";
import { accessState } from "../../systems/access/state";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { gameState } from "../../systems/game/state";
import { groupSystem } from "../../systems/groups";
import { markerSystem } from "../../systems/markers";
import { positionSystem } from "../../systems/position";
import { propertiesSystem } from "../../systems/properties";
import { getProperties } from "../../systems/properties/state";
import { selectedSystem } from "../../systems/selected";
import { locationSettingsSystem } from "../../systems/settings/location";
import { locationSettingsState } from "../../systems/settings/location/state";
import { playerSettingsState } from "../../systems/settings/players/state";
import { TriangulationTarget, VisibilityMode, visionState } from "../../vision/state";
import { setCanvasDimensions } from "../canvas";
import { compositeState } from "../state";

const SECTOR_SIZE = 200;

// js does negative modulo different than expected
function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
}

function getSector(val: number): number {
    const round = Math.floor(val);
    return round - mod(round, SECTOR_SIZE);
}

export class Layer implements ILayer {
    ctx: CanvasRenderingContext2D;

    // When set to false, the layer will be redrawn on the next tick
    protected valid = true;

    playerEditable = false;
    selectable = false;

    isVisionLayer = false;

    // The collection of shapes that this layer contains.
    // These are ordered on a depth basis.
    protected shapes: IShape[] = [];
    shapesInSector: IShape[] = [];
    protected xSectors = new Map<number, Set<LocalId>>();
    protected ySectors = new Map<number, Set<LocalId>>();

    shapeIdsInSector = new Set<LocalId>();

    points = new Map<string, Set<LocalId>>();

    // Extra selection highlighting settings
    protected selectionColor = "#CC0000";
    protected selectionWidth = 2;

    postDrawCallback = callbackProvider();

    constructor(
        public canvas: HTMLCanvasElement,
        public name: LayerName,
        public floor: FloorId,
        protected index: number,
    ) {
        this.ctx = canvas.getContext("2d")!;
    }

    isValid(): boolean {
        return this.valid;
    }

    updateView(): void {
        if (!gameState.raw.boardInitialized) return;

        this.shapeIdsInSector.clear();

        const topLeft = l2g(toLP(0, 0));
        const botRight = l2g(toLP(this.width, this.height));
        const sectorLeft = getSector(topLeft.x);
        const sectorRight = getSector(botRight.x);
        const sectorTop = getSector(topLeft.y);
        const sectorBot = getSector(botRight.y);

        let i = 0;
        let j = 0;

        for (i = sectorLeft; i <= sectorRight; i += SECTOR_SIZE) {
            for (j = sectorTop; j <= sectorBot; j += SECTOR_SIZE) {
                const x = this.xSectors.get(i);
                const y = this.ySectors.get(j);
                if (x !== undefined && y !== undefined) {
                    for (const id of filter(x, (x) => y.has(x))) {
                        this.shapeIdsInSector.add(id);
                    }
                    for (const id of filter(y, (y) => x.has(y))) {
                        this.shapeIdsInSector.add(id);
                    }
                }
            }
        }
        this.shapesInSector = [];
        for (const shape of this.shapes) {
            if (this.shapeIdsInSector.has(shape.id)) this.shapesInSector.push(shape);
        }
        visionState.updateSourcesInSector(this.floor, this.name, this.shapeIdsInSector);
    }

    updateSectors(shapeId: LocalId, aabb: BoundingRect): void {
        this.removeShapeFromSectors(shapeId);
        this.addShapeToSectors(shapeId, aabb);
        this.updateView();
    }

    invalidate(skipLightUpdate: boolean): void {
        if (debugLayers) {
            console.groupCollapsed(`🗑 [${this.floor}] ${this.name}`);
            console.trace();
            console.groupEnd();
        }
        this.valid = false;
        if (!skipLightUpdate) {
            floorSystem.invalidateLight(this.floor);
        }
    }

    get isActiveLayer(): boolean {
        return toRaw(floorState.currentLayer.value) === this;
    }

    get width(): number {
        return this.canvas.width / playerSettingsState.devicePixelRatio.value;
    }

    get height(): number {
        return this.canvas.height / playerSettingsState.devicePixelRatio.value;
    }

    resize(width: number, height: number): void {
        setCanvasDimensions(this.canvas, width, height);
    }

    // SHAPES

    /**
     * Returns the number of shapes on this layer
     */
    size(options: { includeComposites: boolean; onlyInView: boolean }): number {
        return this.getShapes(options).length;
    }

    private addShapeToSectors(shapeId: LocalId, aabb: BoundingRect): void {
        for (let i = getSector(aabb.topLeft.x); i <= getSector(aabb.topRight.x); i += SECTOR_SIZE) {
            if (!this.xSectors.has(i)) this.xSectors.set(i, new Set());
            this.xSectors.get(i)!.add(shapeId);
        }
        for (let i = getSector(aabb.topLeft.y); i <= getSector(aabb.botLeft.y); i += SECTOR_SIZE) {
            if (!this.ySectors.has(i)) this.ySectors.set(i, new Set());
            this.ySectors.get(i)!.add(shapeId);
        }
    }

    private removeShapeFromSectors(shapeId: LocalId): void {
        for (const sector of this.xSectors.values()) {
            sector.delete(shapeId);
        }
        for (const sector of this.ySectors.values()) {
            sector.delete(shapeId);
        }
    }

    addShape(shape: IShape, sync: SyncMode, invalidate: InvalidationMode): void {
        shape.setLayer(this.floor, this.name);

        this.shapes.push(shape);
        this.addShapeToSectors(shape.id, shape.getAuraAABB());
        this.updateView(); // todo: other method that only adds instead of rechecking all existing

        const props = getProperties(shape.id);
        if (props === undefined) return console.error("Missing shape properties");

        propertiesSystem.setBlocksVision(shape.id, props.blocksVision, UI_SYNC, invalidate !== InvalidationMode.NO);
        propertiesSystem.setBlocksMovement(shape.id, props.blocksMovement, UI_SYNC, invalidate !== InvalidationMode.NO);

        shape.invalidatePoints();

        if (accessSystem.hasAccessTo(shape.id, false, { vision: true }) && props.isToken)
            accessSystem.addOwnedToken(shape.id);

        if (sync !== SyncMode.NO_SYNC && !shape.preventSync) {
            sendShapeAdd({
                shape: shape.asDict(),
                floor: shape.floor!.name,
                layer: shape.layer!.name,
                temporary: sync === SyncMode.TEMP_SYNC,
            });
        }
        if (invalidate !== InvalidationMode.NO) this.invalidate(invalidate !== InvalidationMode.WITH_LIGHT);

        if (
            this.isActiveLayer &&
            activeShapeStore.state.id === undefined &&
            activeShapeStore.state.lastUuid === shape.id
        ) {
            selectedSystem.push(shape.id);
        }

        if (sync === SyncMode.FULL_SYNC) {
            addOperation({
                type: "shapeadd",
                shapes: [shape.asDict()],
                floor: shape.floor!.name,
                layerName: shape.layer!.name,
            });
        }
        shape.onLayerAdd();
    }

    // UI helpers are objects that are created for UI reaons but that are not pertinent to the actual state
    // They are often not desired unless in specific circumstances
    getShapes(options: { includeComposites: boolean; onlyInView: boolean }): readonly IShape[] {
        let shapes: readonly IShape[] = options.onlyInView ? this.shapesInSector : this.shapes;
        if (options.includeComposites) {
            shapes = compositeState.addAllCompositeShapes(shapes);
        }
        return shapes;
    }

    pushShapes(...shapes: IShape[]): void {
        this.shapes.push(...shapes);
        for (const shape of shapes) {
            shape.resetVisionIteration();
            this.addShapeToSectors(shape.id, shape.getAuraAABB());
        }
        this.updateView();
    }

    setShapes(...shapes: IShape[]): void {
        this.shapes = shapes;
        this.xSectors.clear();
        this.ySectors.clear();
        for (const shape of shapes) {
            shape.resetVisionIteration();
            this.addShapeToSectors(shape.id, shape.getAuraAABB());
        }
        this.updateView();
    }

    setServerShapes(shapes: ApiShape[]): void {
        if (this.isActiveLayer) selectedSystem.clear(); // TODO: Fix keeping selection on those items that are not moved.
        // We need to ensure composites are added after all their variants have been added
        const composites = [];
        for (const serverShape of shapes) {
            if (serverShape.type_ === "togglecomposite") {
                composites.push(serverShape);
            } else {
                this.setServerShape(serverShape);
            }
        }
        for (const composite of composites) this.setServerShape(composite);
    }

    private setServerShape(serverShape: ApiShape): void {
        const shape = createShapeFromDict(serverShape, this.floor, this.name);
        if (shape === undefined) {
            return;
        }
        let invalidate = InvalidationMode.NO;
        if (visionState.state.mode === VisibilityMode.TRIANGLE_ITERATIVE) {
            invalidate = InvalidationMode.WITH_LIGHT;
        }
        this.addShape(shape, SyncMode.NO_SYNC, invalidate);
    }

    removeShape(shape: IShape, options: { sync: SyncMode; recalculate: boolean; dropShapeId: boolean }): boolean {
        const idx = this.shapes.indexOf(shape);
        if (idx < 0) {
            console.error("attempted to remove shape not in layer.");
            return false;
        }
        const gId = getGlobalId(shape.id);
        if (gId === undefined) {
            console.error("Removing shape without global id");
            return false;
        }

        if (locationSettingsState.raw.spawnLocations.value.includes(gId)) {
            locationSettingsSystem.setSpawnLocations(
                locationSettingsState.raw.spawnLocations.value.filter((s) => s !== gId),
                locationSettingsState.raw.activeLocation,
                true,
            );
        }
        shape.removeDependentShapes({ dropShapeId: true });
        this.shapes.splice(idx, 1);
        this.removeShapeFromSectors(shape.id);
        this.updateView();

        groupSystem.removeGroupMember(shape.id, false);

        if (options.sync !== SyncMode.NO_SYNC && !shape.preventSync)
            sendRemoveShapes({ uuids: [gId], temporary: options.sync === SyncMode.TEMP_SYNC });

        visionState.removeBlocker(TriangulationTarget.VISION, this.floor, shape, options.recalculate);
        visionState.removeBlocker(TriangulationTarget.MOVEMENT, this.floor, shape, options.recalculate);
        visionState.removeVisionSources(this.floor, shape.id);

        accessSystem.removeOwnedToken(shape.id);

        // Needs to be retrieved before dropping the ID
        const triggersVisionRecalc = shape.triggersVisionRecalc;

        if (options.dropShapeId) dropId(shape.id);
        markerSystem.removeMarker(shape.id, true);

        if (this.isActiveLayer) selectedSystem.remove(shape.id);

        this.invalidate(!triggersVisionRecalc);
        return true;
    }

    // TODO: This does not take into account shapes that the server does not know about
    moveShapeOrder(shape: IShape, destinationIndex: number, sync: SyncMode): void {
        const oldIdx = this.shapes.indexOf(shape);
        if (oldIdx === destinationIndex) return;
        this.shapes.splice(oldIdx, 1);
        this.shapes.splice(destinationIndex, 0, shape);
        if (sync !== SyncMode.NO_SYNC && !shape.preventSync) {
            const uuid = getGlobalId(shape.id);
            if (uuid)
                sendShapeOrder({
                    uuid,
                    index: destinationIndex,
                    temporary: sync === SyncMode.TEMP_SYNC,
                });
        }
        this.updateView();
        this.invalidate(true);
    }

    // DRAW

    hide(): void {
        this.canvas.style.display = "none";
    }

    show(): void {
        this.canvas.style.removeProperty("display");
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    draw(doClear = true): void {
        if (!this.valid) {
            if (debugLayers) {
                console.groupCollapsed(`🖌 [${this.floor}] ${this.name}`);
                console.trace();
                console.groupEnd();
            }
            const ctx = this.ctx;
            const ogOP = ctx.globalCompositeOperation;

            if (doClear) this.clear();

            if (this.name !== LayerName.Lighting && this.selectable) {
                if (floorState.raw.layerIndex < this.index) ctx.globalAlpha = 0.3;
                else ctx.globalAlpha = 1.0;
            }

            // We iterate twice over all shapes
            // First to draw the auras and a second time to draw the shapes themselves
            // Otherwise auras from one shape could overlap another shape.

            const isActiveLayer = this.isActiveLayer;
            const gridType = locationSettingsState.raw.gridType.value;

            if (this.name !== LayerName.Lighting || isActiveLayer) {
                // Aura draw loop
                for (const shape of this.shapesInSector) {
                    if (shape.options.skipDraw ?? false) continue;

                    const props = getProperties(shape.id);
                    if (props?.showCells === true) {
                        drawCells(
                            ctx,
                            cloneP(shape.center),
                            shape.getSize(gridType),
                            { type: gridType, oddHexOrientation: props.oddHexOrientation },
                            {
                                fill: props.cellFillColour,
                                stroke: props.cellStrokeColour,
                                strokeWidth: props.cellStrokeWidth,
                            },
                        );
                    }

                    drawAuras(shape, ctx);
                }

                // Normal shape draw loop
                for (const shape of this.shapesInSector) {
                    if (shape.options.skipDraw ?? false) continue;
                    const props = getProperties(shape.id)!;
                    if (props.isInvisible && !accessSystem.hasAccessTo(shape.id, true, { vision: true })) continue;

                    shape.draw(ctx, false);
                }
            }

            if (isActiveLayer && selectedSystem.hasSelection) {
                ctx.fillStyle = this.selectionColor;
                ctx.strokeStyle = this.selectionColor;
                ctx.lineWidth = this.selectionWidth;
                for (const shape of selectedSystem.get({ includeComposites: false })) {
                    shape.drawSelection(ctx);
                }
            }

            // If this is the last layer of the floor below, render some shadow
            if (floorState.raw.floorIndex > 0) {
                const lowerFloor = floorState.raw.floors[floorState.raw.floorIndex - 1];
                if (lowerFloor?.id === this.floor) {
                    const layers = floorSystem.getLayers(lowerFloor);
                    if (layers.at(-1)?.name === this.name) {
                        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
                        ctx.fillRect(0, 0, this.width, this.height);
                    }
                }
            }

            // show nearby tokens
            if (playerSettingsState.raw.showTokenDirections.value) {
                if (this.floor === floorState.currentFloor.value?.id && this.name === LayerName.Draw) {
                    const bbox = new BoundingRect(positionSystem.screenTopLeft, l2gz(this.width), l2gz(this.height));
                    const bboxCenter = bbox.center;
                    for (const token of accessState.activeTokens.value) {
                        let found = false;
                        const shape = getShape(token);
                        if (shape !== undefined && shape.floorId === this.floor && shape.type === "assetrect") {
                            if (!shape.visibleInCanvas({ w: this.width, h: this.height }, { includeAuras: false })) {
                                const ray = Ray.fromPoints(shape.center, bboxCenter);
                                const { hit, min } = bbox.containsRay(ray);
                                if (hit) {
                                    let target = ray.get(min);
                                    const modifiedRay = new Ray(g2l(ray.get(min)), ray.direction);
                                    drawTear(modifiedRay, { fillColour: playerSettingsState.raw.rulerColour.value });
                                    target = ray.getPointAtDistance(l2gz(68), min);
                                    shape.draw(ctx, false, { center: target, width: 60, height: 60 });
                                    positionSystem.setTokenDirection(token, g2l(target));
                                    found = true;
                                }
                            }
                        }
                        if (!found) positionSystem.setTokenDirection(token, undefined);
                    }
                }
            }

            ctx.globalCompositeOperation = ogOP;
            this.valid = true;
            this.postDrawCallback.resolveAll();
        } else {
            this.ctx.clearRect(0, 0, 1, 1);
        }
    }
}
