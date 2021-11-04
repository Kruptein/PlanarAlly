import { InvalidationMode, SyncMode, SyncTo } from "../../../core/models/types";
import { activeShapeStore } from "../../../store/activeShape";
import { clientStore } from "../../../store/client";
import { floorStore } from "../../../store/floor";
import { gameStore } from "../../../store/game";
import { settingsStore } from "../../../store/settings";
import { UuidMap } from "../../../store/shapeMap";
import { sendRemoveShapes, sendShapeAdd, sendShapeOrder } from "../../api/emits/shape/core";
import { drawAuras } from "../../draw";
import { removeGroupMember } from "../../groups";
import { LayerName } from "../../models/floor";
import type { ServerShape } from "../../models/shapes";
import { addOperation } from "../../operations/undo";
import type { IShape } from "../../shapes/interfaces";
import { createShapeFromDict } from "../../shapes/utils";
import { initiativeStore } from "../../ui/initiative/state";
import { TriangulationTarget, VisibilityMode, visionState } from "../../vision/state";
import { setCanvasDimensions } from "../canvas";
import { selectionState } from "../selection";
import { compositeState } from "../state";

export class Layer {
    ctx: CanvasRenderingContext2D;

    // When set to false, the layer will be redrawn on the next tick
    protected valid = false;

    playerEditable = false;
    selectable = false;

    isVisionLayer = false;

    // The collection of shapes that this layer contains.
    // These are ordered on a depth basis.
    protected shapes: IShape[] = [];

    protected shapesInView: Set<string> = new Set();

    points: Map<string, Set<string>> = new Map();

    // Extra selection highlighting settings
    protected selectionColor = "#CC0000";
    protected selectionWidth = 2;

    protected postDrawCallbacks: (() => void)[] = [];

    constructor(
        public canvas: HTMLCanvasElement,
        public name: LayerName,
        public floor: number,
        protected index: number,
    ) {
        this.ctx = canvas.getContext("2d")!;
    }

    invalidate(skipLightUpdate: boolean): void {
        this.valid = false;
        if (!skipLightUpdate) {
            floorStore.invalidateLight(this.floor);
        }
    }

    get isActiveLayer(): boolean {
        return floorStore.currentLayer.value === this;
    }

    get width(): number {
        return this.canvas.width / clientStore.devicePixelRatio.value;
    }

    get height(): number {
        return this.canvas.height / clientStore.devicePixelRatio.value;
    }

    resize(width: number, height: number): void {
        setCanvasDimensions(this.canvas, width, height);
    }

    // SHAPES

    invalidateView(): void {
        this.shapesInView.clear();
        for (const shape of this.shapes) {
            if (shape.visibleInCanvas({ w: this.width, h: this.height }, { includeAuras: true }))
                this.shapesInView.add(shape.uuid);
        }
    }

    updateShapeView(shape: IShape): void {
        const wasInSet = this.shapesInView.has(shape.uuid);
        const shouldBeInSet = shape.visibleInCanvas({ w: this.width, h: this.height }, { includeAuras: true });

        if (wasInSet !== shouldBeInSet) {
            visionState.invalidateView(this.floor);
            if (shouldBeInSet) this.shapesInView.add(shape.uuid);
            else this.shapesInView.delete(shape.uuid);
        }
    }

    /**
     * Returns the number of shapes on this layer
     */
    size(options: { skipUiHelpers?: boolean; includeComposites: boolean }): number {
        return this.getShapes(options).length;
    }

    addShape(shape: IShape, sync: SyncMode, invalidate: InvalidationMode, options?: { snappable?: boolean }): void {
        shape.setLayer(this.floor, this.name);

        this.shapes.push(shape);
        if (shape.visibleInCanvas({ w: this.width, h: this.height }, { includeAuras: true }))
            this.shapesInView.add(shape.uuid);

        UuidMap.set(shape.uuid, shape);
        shape.setBlocksVision(shape.blocksVision, SyncTo.UI, invalidate !== InvalidationMode.NO);
        shape.setBlocksMovement(shape.blocksMovement, SyncTo.UI, invalidate !== InvalidationMode.NO);

        shape.invalidatePoints();
        if (options?.snappable ?? true) {
            for (const point of shape.points) {
                const strp = JSON.stringify(point);
                this.points.set(strp, (this.points.get(strp) || new Set()).add(shape.uuid));
            }
        }

        if (shape.ownedBy(false, { visionAccess: true }) && shape.isToken) gameStore.addOwnedToken(shape.uuid);
        if (shape.annotation.length) gameStore.addAnnotation(shape.uuid);
        if (sync !== SyncMode.NO_SYNC && !shape.preventSync) {
            sendShapeAdd({ shape: shape.asDict(), temporary: sync === SyncMode.TEMP_SYNC });
        }
        if (invalidate) this.invalidate(invalidate !== InvalidationMode.WITH_LIGHT);

        if (
            this.isActiveLayer &&
            activeShapeStore.state.uuid === undefined &&
            activeShapeStore.state.lastUuid === shape.uuid
        ) {
            selectionState.push(shape);
        }

        if (sync === SyncMode.FULL_SYNC) {
            addOperation({ type: "shapeadd", shapes: [shape.asDict()] });
        }
        shape.onLayerAdd();
    }

    // UI helpers are objects that are created for UI reaons but that are not pertinent to the actual state
    // They are often not desired unless in specific circumstances
    getShapes(options: { skipUiHelpers?: boolean; includeComposites: boolean }): readonly IShape[] {
        const skipUiHelpers = options.skipUiHelpers ?? true;
        let shapes: readonly IShape[] = skipUiHelpers
            ? this.shapes.filter((s) => !(s.options.UiHelper ?? false))
            : this.shapes;
        if (options.includeComposites) {
            shapes = compositeState.addAllCompositeShapes(shapes);
        }
        return shapes;
    }

    pushShapes(...shapes: IShape[]): void {
        this.shapes.push(...shapes);
        for (const shape of shapes) {
            if (shape.visibleInCanvas({ w: this.width, h: this.height }, { includeAuras: true }))
                this.shapesInView.add(shape.uuid);
        }
    }

    setShapes(...shapes: IShape[]): void {
        this.shapes = shapes;
        this.invalidateView();
    }

    setServerShapes(shapes: ServerShape[]): void {
        if (this.isActiveLayer) selectionState.clear(); // TODO: Fix keeping selection on those items that are not moved.
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

    private setServerShape(serverShape: ServerShape): void {
        const shape = createShapeFromDict(serverShape);
        if (shape === undefined) {
            console.log(`Shape with unknown type ${serverShape.type_} could not be added`);
            return;
        }
        let invalidate = InvalidationMode.NO;
        if (visionState.state.mode === VisibilityMode.TRIANGLE_ITERATIVE) {
            invalidate = InvalidationMode.WITH_LIGHT;
        }
        this.addShape(shape, SyncMode.NO_SYNC, invalidate);
    }

    removeShape(shape: IShape, sync: SyncMode, recalculate: boolean): boolean {
        const idx = this.shapes.indexOf(shape);
        if (idx < 0) {
            console.error("attempted to remove shape not in layer.");
            return false;
        }
        const locationOptions = settingsStore.currentLocationOptions.value;
        if (locationOptions.spawnLocations!.includes(shape.uuid)) {
            settingsStore.setSpawnLocations(
                locationOptions.spawnLocations!.filter((s) => s !== shape.uuid),
                settingsStore.state.activeLocation,
                true,
            );
        }
        this.shapes.splice(idx, 1);
        this.shapesInView.delete(shape.uuid);

        if (shape.groupId !== undefined) {
            removeGroupMember(shape.groupId, shape.uuid, false);
        }

        if (sync !== SyncMode.NO_SYNC && !shape.preventSync)
            sendRemoveShapes({ uuids: [shape.uuid], temporary: sync === SyncMode.TEMP_SYNC });

        visionState.removeBlocker(TriangulationTarget.VISION, this.floor, shape, recalculate);
        visionState.removeBlocker(TriangulationTarget.MOVEMENT, this.floor, shape, recalculate);
        visionState.removeVisionSources(this.floor, shape.uuid);

        gameStore.removeAnnotation(shape.uuid);

        gameStore.removeOwnedToken(shape.uuid);

        UuidMap.delete(shape.uuid);
        gameStore.removeMarker(shape.uuid, true);

        for (const point of shape.points) {
            const strp = JSON.stringify(point);
            const val = this.points.get(strp);
            if (val === undefined || val.size === 1) this.points.delete(strp);
            else val.delete(shape.uuid);
        }

        if (this.isActiveLayer) selectionState.remove(shape.uuid);

        if (sync === SyncMode.FULL_SYNC) initiativeStore.removeInitiative(shape.uuid, false);
        this.invalidate(!shape.triggersVisionRecalc);
        return true;
    }

    // TODO: This does not take into account shapes that the server does not know about
    moveShapeOrder(shape: IShape, destinationIndex: number, sync: SyncMode): void {
        const oldIdx = this.shapes.indexOf(shape);
        if (oldIdx === destinationIndex) return;
        this.shapes.splice(oldIdx, 1);
        this.shapes.splice(destinationIndex, 0, shape);
        if (sync !== SyncMode.NO_SYNC && !shape.preventSync)
            sendShapeOrder({ uuid: shape.uuid, index: destinationIndex, temporary: sync === SyncMode.TEMP_SYNC });
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
            const ctx = this.ctx;
            const ogOP = ctx.globalCompositeOperation;

            if (doClear) this.clear();

            const floorState = floorStore.state;
            const gameState = gameStore.state;

            // We iterate twice over all shapes
            // First to draw the auras and a second time to draw the shapes themselves
            // Otherwise auras from one shape could overlap another shape.

            const isActiveLayer = this.isActiveLayer;

            if (this.name !== LayerName.Lighting || isActiveLayer) {
                const visibleShapes: IShape[] = [];
                // Aura draw loop
                for (const shape of this.shapes) {
                    if (!this.shapesInView.has(shape.uuid)) continue;
                    if (shape.options.skipDraw ?? false) continue;
                    drawAuras(shape, ctx);
                    visibleShapes.push(shape);
                }
                // Normal shape draw loop
                for (const shape of visibleShapes) {
                    if (shape.isInvisible && !shape.ownedBy(true, { visionAccess: true })) continue;
                    if (shape.labels.length === 0 && gameState.filterNoLabel) continue;
                    if (
                        shape.labels.length &&
                        gameState.labelFilters.length &&
                        !shape.labels.some((l) => gameState.labelFilters.includes(l.uuid))
                    )
                        continue;
                    shape.draw(ctx);
                }
            }

            if (isActiveLayer && selectionState.hasSelection) {
                ctx.fillStyle = this.selectionColor;
                ctx.strokeStyle = this.selectionColor;
                ctx.lineWidth = this.selectionWidth;
                for (const shape of selectionState.get({ includeComposites: false })) {
                    shape.drawSelection(ctx);
                }
            }

            // If this is the last layer of the floor below, render some shadow
            if (floorState.floorIndex > 0) {
                const lowerFloor = floorState.floors[floorState.floorIndex - 1];
                if (lowerFloor.id === this.floor) {
                    const layers = floorStore.getLayers(lowerFloor);
                    if (layers[layers.length - 1].name === this.name) {
                        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
                        ctx.fillRect(0, 0, this.width, this.height);
                    }
                }
            }

            ctx.globalCompositeOperation = ogOP;
            this.valid = true;
            this.resolveCallbacks();
        }
    }

    // CALLBACKS

    waitValid(): Promise<void> {
        return new Promise((resolve, _reject) => {
            this.postDrawCallbacks.push(resolve);
        });
    }

    private resolveCallbacks(): void {
        for (const cb of this.postDrawCallbacks) cb();
        this.postDrawCallbacks = [];
    }
}
