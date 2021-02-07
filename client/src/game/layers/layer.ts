import { InvalidationMode, SyncMode, SyncTo } from "@/core/comm/types";
import { ServerShape } from "@/game/comm/types/shapes";
import { EventBus } from "@/game/event-bus";
import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";
import { createShapeFromDict } from "@/game/shapes/utils";
import { gameStore } from "@/game/store";
import { TriangulationTarget } from "@/game/visibility/te/pa";
import { removeBlocker, removeVisionSources } from "@/game/visibility/utils";

import { sendRemoveShapes, sendShapeAdd, sendShapeOrder } from "../api/emits/shape/core";
import { removeGroupMember } from "../groups";
import { addOperation } from "../operations/undo";
import { gameSettingsStore } from "../settings";
import { drawAuras } from "../shapes/trackers/draw";
import { activeShapeStore } from "../ui/ActiveShapeStore";

import { floorStore } from "./store";
import { addAllCompositeShapes } from "./utils";

export class Layer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    selectable = false;
    playerEditable = false;
    isVisionLayer = false;

    // When set to false, the layer will be redrawn on the next tick
    valid = false;
    // The collection of shapes that this layer contains.
    // These are ordered on a depth basis.
    protected shapes: Shape[] = [];

    // Collection of shapes that are currently selected
    protected selection: Shape[] = [];

    // Extra selection highlighting settings
    selectionColor = "#CC0000";
    selectionWidth = 2;

    points: Map<string, Set<string>> = new Map();
    postDrawCallbacks: (() => void)[] = [];

    constructor(canvas: HTMLCanvasElement, public name: string, public floor: number, public index: number) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
    }

    invalidate(skipLightUpdate: boolean): void {
        this.valid = false;
        if (!skipLightUpdate) {
            layerManager.invalidateLight(layerManager.getFloor(this.floor)!);
        }
    }

    /**
     * Returns the number of shapes on this layer
     */
    size(options: { skipUiHelpers?: boolean; includeComposites: boolean }): number {
        return this.getShapes(options).length;
    }

    // UI helpers are objects that are created for UI reaons but that are not pertinent to the actual state
    // They are often not desired unless in specific circumstances
    getShapes(options: { skipUiHelpers?: boolean; includeComposites: boolean }): readonly Shape[] {
        const skipUiHelpers = options.skipUiHelpers ?? true;
        let shapes: readonly Shape[] = skipUiHelpers
            ? this.shapes.filter((s) => !s.options.has("UiHelper"))
            : this.shapes;
        if (options.includeComposites) {
            shapes = addAllCompositeShapes(shapes);
        }
        return shapes;
    }

    setShapes(...shapes: Shape[]): void {
        this.shapes = shapes;
    }

    pushShapes(...shapes: Shape[]): void {
        this.shapes.push(...shapes);
    }

    hasSelection(options: { skipUiHelpers?: boolean; includeComposites: boolean }): boolean {
        return this.getSelection(options).length > 0;
    }

    // UI helpers are objects that are created for UI reaons but that are not pertinent to the actual state
    // They are often not desired unless in specific circumstances
    getSelection(options: { skipUiHelpers?: boolean; includeComposites: boolean }): readonly Shape[] {
        const skipUiHelpers = options.skipUiHelpers ?? true;
        const selection = skipUiHelpers ? this.selection.filter((s) => !s.options.has("UiHelper")) : this.selection;
        return options.includeComposites ? addAllCompositeShapes(selection) : selection;
    }

    setSelection(...selection: Shape[]): void {
        if (selection.length === 0) {
            activeShapeStore.clear();
        } else {
            if (this.selection.length === 0 || this.selection[0] !== selection[0])
                activeShapeStore.setActiveShape(selection[0]);
        }
        this.selection = selection;
        EventBus.$emit("SelectionInfo.Shapes.Set", this.getSelection({ includeComposites: false }));
    }

    pushSelection(...selection: Shape[]): void {
        if (selection.length > 0) {
            if (this.selection.length === 0) activeShapeStore.setActiveShape(selection[0]);
            else if (this.selection[0] !== selection[0]) activeShapeStore.setActiveShape(selection[0]);
        }
        this.selection.push(...selection);
        EventBus.$emit("SelectionInfo.Shapes.Set", this.getSelection({ includeComposites: false }));
    }

    get width(): number {
        return this.canvas.width;
    }

    set width(width: number) {
        this.canvas.width = width;
    }

    get height(): number {
        return this.canvas.height;
    }

    set height(height: number) {
        this.canvas.height = height;
    }

    addShape(shape: Shape, sync: SyncMode, invalidate: InvalidationMode, snappable = true): void {
        shape.setLayer(this.floor, this.name);
        this.shapes.push(shape);
        layerManager.UUIDMap.set(shape.uuid, shape);
        shape.setVisionBlock(shape.visionObstruction, SyncTo.UI, invalidate !== InvalidationMode.NO);
        shape.setMovementBlock(shape.movementObstruction, SyncTo.UI, invalidate !== InvalidationMode.NO);
        if (snappable) {
            for (const point of shape.points) {
                const strp = JSON.stringify(point);
                this.points.set(strp, (this.points.get(strp) || new Set()).add(shape.uuid));
            }
        }
        if (shape.ownedBy(false, { visionAccess: true }) && shape.isToken) gameStore.addOwnedToken(shape.uuid);
        if (shape.annotation.length) gameStore.annotations.push(shape.uuid);
        if (sync !== SyncMode.NO_SYNC && !shape.preventSync)
            sendShapeAdd({ shape: shape.asDict(), temporary: sync === SyncMode.TEMP_SYNC });
        if (invalidate) this.invalidate(invalidate !== InvalidationMode.WITH_LIGHT);

        if (activeShapeStore.uuid === undefined && activeShapeStore.lastUuid === shape.uuid) {
            const selection = this.getSelection({ skipUiHelpers: false, includeComposites: false });
            this.setSelection(shape, ...selection);
        }

        if (sync === SyncMode.FULL_SYNC) {
            addOperation({ type: "shapeadd", shapes: [shape.asDict()] });
        }
    }

    async setServerShapes(shapes: ServerShape[]): Promise<void> {
        // We need to ensure composites are added after all their variants have been added
        const composites = [];
        for (const serverShape of shapes) {
            if (serverShape.type_ === "togglecomposite") {
                composites.push(serverShape);
            } else {
                await this.setServerShape(serverShape);
            }
        }
        for (const composite of composites) await this.setServerShape(composite);
        this.clearSelection(); // TODO: Fix keeping selection on those items that are not moved.
    }

    private async setServerShape(serverShape: ServerShape): Promise<void> {
        const shape = await createShapeFromDict(serverShape);
        if (shape === undefined) {
            console.log(`Shape with unknown type ${serverShape.type_} could not be added`);
            return;
        }
        this.addShape(shape, SyncMode.NO_SYNC, InvalidationMode.NO);
    }

    removeShape(shape: Shape, sync: SyncMode, recalculate: boolean): boolean {
        const idx = this.shapes.indexOf(shape);
        if (idx < 0) {
            console.error("attempted to remove shape not in layer.");
            return false;
        }
        if (gameSettingsStore.currentLocationOptions.spawnLocations!.includes(shape.uuid)) {
            gameSettingsStore.setSpawnLocations({
                spawnLocations: gameSettingsStore.currentLocationOptions.spawnLocations!.filter(
                    (s) => s !== shape.uuid,
                ),
                location: gameSettingsStore.activeLocation,
                sync: true,
            });
        }
        this.shapes.splice(idx, 1);

        if (shape.groupId !== undefined) {
            removeGroupMember(shape.groupId, shape.uuid, false);
        }

        if (sync !== SyncMode.NO_SYNC && !shape.preventSync)
            sendRemoveShapes({ uuids: [shape.uuid], temporary: sync === SyncMode.TEMP_SYNC });

        removeBlocker(TriangulationTarget.VISION, this.floor, shape, recalculate);
        removeBlocker(TriangulationTarget.MOVEMENT, this.floor, shape, recalculate);
        removeVisionSources(this.floor, shape.uuid);

        const annotationIndex = gameStore.annotations.indexOf(shape.uuid);
        if (annotationIndex >= 0) gameStore.annotations.splice(annotationIndex, 1);

        gameStore.removeOwnedToken(shape.uuid);

        layerManager.UUIDMap.delete(shape.uuid);
        gameStore.removeMarker({ marker: shape.uuid, sync: true });

        for (const point of shape.points) {
            const strp = JSON.stringify(point);
            const val = this.points.get(strp);
            if (val === undefined || val.size === 1) this.points.delete(strp);
            else val.delete(shape.uuid);
        }

        const index = this.selection.indexOf(shape);
        if (index >= 0) this.selection.splice(index, 1);

        if ([activeShapeStore.uuid, activeShapeStore.parentUuid].includes(shape.uuid)) {
            activeShapeStore.clear();
        }

        EventBus.$emit("Initiative.Remove", shape.uuid);
        EventBus.$emit("Initiative.ForceUpdate");
        this.invalidate(!shape.triggersVisionRecalc);
        return true;
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    clearSelection(): void {
        this.selection = [];
        EventBus.$emit("SelectionInfo.Shapes.Set", []);
    }

    hide(): void {
        this.canvas.style.display = "none";
    }

    show(): void {
        this.canvas.style.removeProperty("display");
    }

    draw(doClear = true): void {
        if (!this.valid) {
            const ctx = this.ctx;
            const ogOP = ctx.globalCompositeOperation;

            if (doClear) this.clear();

            // We iterate twice over all shapes
            // First to draw the auras and a second time to draw the shapes themselves
            // Otherwise auras from one shape could overlap another shape.

            const currentLayer = floorStore.currentLayer;
            // To optimize things slightly, we keep track of the shapes that passed the first round
            const visibleShapes: Shape[] = [];

            for (const shape of this.shapes) {
                if (shape.options.has("skipDraw") && shape.options.get("skipDraw")) continue;
                if (!shape.visibleInCanvas(this.canvas, { includeAuras: true })) continue;
                if (this.name === "fow" && currentLayer !== this) continue;
                drawAuras(shape, ctx);
                visibleShapes.push(shape);
            }
            for (const shape of visibleShapes) {
                if (shape.isInvisible && !shape.ownedBy(true, { visionAccess: true })) continue;
                if (shape.labels.length === 0 && gameStore.filterNoLabel) continue;
                if (
                    shape.labels.length &&
                    gameStore.labelFilters.length &&
                    !shape.labels.some((l) => gameStore.labelFilters.includes(l.uuid))
                )
                    continue;
                shape.draw(ctx);
            }

            if (this.selection != null) {
                ctx.fillStyle = this.selectionColor;
                ctx.strokeStyle = this.selectionColor;
                ctx.lineWidth = this.selectionWidth;
                for (const shape of this.selection) {
                    shape.drawSelection(ctx);
                }
            }

            // If this is the last layer of the floor below, render some shadow
            if (floorStore.currentFloorindex > 0) {
                const lowerFloor = floorStore.floors[floorStore.currentFloorindex - 1];
                if (lowerFloor.id === this.floor) {
                    const layers = layerManager.getLayers(lowerFloor);
                    if (layers[layers.length - 1].name === this.name) {
                        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
                        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    }
                }
            }

            ctx.globalCompositeOperation = ogOP;
            this.valid = true;
            this.resolveCallbacks();
        }
    }

    waitValid(): Promise<void> {
        return new Promise((resolve, _reject) => {
            this.postDrawCallbacks.push(resolve);
        });
    }

    private resolveCallbacks(): void {
        for (const cb of this.postDrawCallbacks) cb();
        this.postDrawCallbacks = [];
    }

    moveShapeOrder(shape: Shape, destinationIndex: number, sync: SyncMode): void {
        const oldIdx = this.shapes.indexOf(shape);
        if (oldIdx === destinationIndex) return;
        this.shapes.splice(oldIdx, 1);
        this.shapes.splice(destinationIndex, 0, shape);
        if (sync !== SyncMode.NO_SYNC && !shape.preventSync)
            sendShapeOrder({ uuid: shape.uuid, index: destinationIndex, temporary: sync === SyncMode.TEMP_SYNC });
        this.invalidate(true);
    }

    updateShapePoints(shape: Shape): void {
        for (const point of this.points) {
            if (point[1].has(shape.uuid)) {
                if (point[1].size === 1) this.points.delete(point[0]);
                else point[1].delete(shape.uuid);
            }
        }
        for (const point of shape.points) {
            const strp = JSON.stringify(point);
            if (this.points.has(strp) && !this.points.get(strp)!.has(shape.uuid))
                this.points.get(strp)!.add(shape.uuid);
            else if (!this.points.has(strp)) this.points.set(strp, new Set([shape.uuid]));
        }
    }
}
