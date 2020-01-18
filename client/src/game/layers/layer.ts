import { socket } from "@/game/api/socket";
import { ServerShape } from "@/game/comm/types/shapes";
import { EventBus } from "@/game/event-bus";
import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";
import { createShapeFromDict } from "@/game/shapes/utils";
import { gameStore } from "@/game/store";
import { visibilityStore } from "../visibility/store";

export class Layer {
    name: string;
    width: number;
    height: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    selectable = false;
    playerEditable = false;
    isVisionLayer = false;

    // When set to false, the layer will be redrawn on the next tick
    valid = false;
    // The collection of shapes that this layer contains.
    // These are ordered on a depth basis.
    shapes: Shape[] = [];

    // Collection of shapes that are currently selected
    selection: Shape[] = [];

    // Extra selection highlighting settings
    selectionColor = "#CC0000";
    selectionWidth = 2;

    points: Map<number[], number> = new Map();

    constructor(canvas: HTMLCanvasElement, name: string) {
        this.canvas = canvas;
        this.name = name;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = canvas.getContext("2d")!;
    }

    invalidate(skipLightUpdate: boolean): void {
        this.valid = false;
        if (!skipLightUpdate) {
            layerManager.invalidateLight();
        }
    }

    addShape(shape: Shape, sync: boolean, temporary?: boolean, invalidate = true): void {
        if (temporary === undefined) temporary = false;
        shape.layer = this.name;
        this.shapes.push(shape);
        layerManager.UUIDMap.set(shape.uuid, shape);
        shape.checkVisionSources(invalidate);
        shape.setMovementBlock(shape.movementObstruction, invalidate);
        for (const point of shape.points) {
            this.points.set(point, (this.points.get(point) || 0) + 1);
        }
        if (shape.ownedBy(gameStore.username) && shape.isToken) gameStore.ownedtokens.push(shape.uuid);
        if (shape.annotation.length) gameStore.annotations.push(shape.uuid);
        if (sync) socket.emit("Shape.Add", { shape: shape.asDict(), temporary });
        if (invalidate) this.invalidate(!sync);
    }

    setShapes(shapes: ServerShape[]): void {
        for (const serverShape of shapes) {
            const shape = createShapeFromDict(serverShape);
            if (shape === undefined) {
                console.log(`Shape with unknown type ${serverShape.type_} could not be added`);
                return;
            }
            this.addShape(shape, false, false, false);
        }
        this.clearSelection(); // TODO: Fix keeping selection on those items that are not moved.
        this.invalidate(false);
    }

    removeShape(shape: Shape, sync: boolean, temporary?: boolean): void {
        if (temporary === undefined) temporary = false;
        const idx = this.shapes.indexOf(shape);
        if (idx < 0) {
            console.error("attempted to remove shape not in layer.");
            return;
        }
        this.shapes.splice(idx, 1);

        if (sync) socket.emit("Shape.Remove", { shape: shape.asDict(), temporary });
        const lsI = visibilityStore.visionSources.findIndex(ls => ls.shape === shape.uuid);
        const lbI = visibilityStore.visionBlockers.findIndex(ls => ls === shape.uuid);

        const mbI = visibilityStore.movementblockers.findIndex(ls => ls === shape.uuid);
        const anI = gameStore.annotations.findIndex(ls => ls === shape.uuid);
        if (lsI >= 0) visibilityStore.visionSources.splice(lsI, 1);
        if (lbI >= 0) visibilityStore.visionBlockers.splice(lbI, 1);
        if (mbI >= 0) visibilityStore.movementblockers.splice(mbI, 1);
        if (anI >= 0) gameStore.annotations.splice(anI, 1);

        const annotationIndex = gameStore.annotations.indexOf(shape.uuid);
        if (annotationIndex >= 0) gameStore.annotations.splice(annotationIndex, 1);

        const ownedIndex = gameStore.ownedtokens.indexOf(shape.uuid);
        if (ownedIndex >= 0) gameStore.ownedtokens.splice(ownedIndex, 1);

        layerManager.UUIDMap.delete(shape.uuid);

        for (const point of shape.points) {
            const val = this.points.get(point) || 0;
            if (val <= 1) this.points.delete(point);
            else this.points.set(point, val - 1);
        }

        const index = this.selection.indexOf(shape);
        if (index >= 0) this.selection.splice(index, 1);
        if (lbI >= 0) visibilityStore.recalculateVision();
        if (mbI >= 0) visibilityStore.recalculateMovement();
        this.invalidate(!sync);
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    clearSelection(): void {
        this.selection = [];
        EventBus.$emit("SelectionInfo.Shape.Set", null);
    }

    draw(doClear?: boolean): void {
        if (!this.valid) {
            const ctx = this.ctx;
            const ogOP = ctx.globalCompositeOperation;
            doClear = doClear === undefined ? true : doClear;

            if (doClear) this.clear();

            // We iterate twice over all shapes
            // First to draw the auras and a second time to draw the shapes themselves
            // Otherwise auras from one shape could be overlapping another shape itself.

            for (const shape of this.shapes) {
                if (shape.options.has("skipDraw") && shape.options.get("skipDraw")) continue;
                if (layerManager.getLayer() === undefined) continue;
                if (!shape.visibleInCanvas(this.canvas)) continue;
                if (this.name === "fow" && layerManager.getLayer()!.name !== this.name) continue;
                shape.drawAuras(ctx);
            }
            for (const shape of this.shapes) {
                if (shape.options.has("skipDraw") && shape.options.get("skipDraw")) continue;
                if (shape.labels.length === 0 && gameStore.filterNoLabel) continue;
                if (
                    shape.labels.length &&
                    gameStore.labelFilters.length &&
                    !shape.labels.some(l => gameStore.labelFilters.includes(l.uuid))
                )
                    continue;
                if (layerManager.getLayer() === undefined) continue;
                if (!shape.visibleInCanvas(this.canvas)) continue;
                if (this.name === "fow" && layerManager.getLayer()!.name !== this.name) continue;
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
            ctx.globalCompositeOperation = ogOP;
            this.valid = true;
        }
    }

    moveShapeOrder(shape: Shape, destinationIndex: number, sync: boolean): void {
        const oldIdx = this.shapes.indexOf(shape);
        if (oldIdx === destinationIndex) return;
        this.shapes.splice(oldIdx, 1);
        this.shapes.splice(destinationIndex, 0, shape);
        if (sync) socket.emit("Shape.Order.Set", { shape: shape.asDict(), index: destinationIndex });
        this.invalidate(true);
    }
}
