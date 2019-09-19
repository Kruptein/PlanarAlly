import { socket } from "@/game/api/socket";
import { ServerShape } from "@/game/comm/types/shapes";
import { EventBus } from "@/game/event-bus";
import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";
import { createShapeFromDict } from "@/game/shapes/utils";
import { gameStore } from "@/game/store";
import { g2lx, g2ly } from "@/game/units";
import { visibilityStore } from "../visibility/store";
import { TriangulationTarget } from "../visibility/te/pa";

export class Layer {
    name: string;
    width: number;
    height: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    selectable: boolean = false;
    playerEditable: boolean = false;
    isVisionLayer: boolean = false;

    // When set to false, the layer will be redrawn on the next tick
    valid: boolean = false;
    // The collection of shapes that this layer contains.
    // These are ordered on a depth basis.
    shapes: Shape[] = [];

    // Collection of shapes that are currently selected
    selection: Shape[] = [];

    // Extra selection highlighting settings
    selectionColor = "#CC0000";
    selectionWidth = 2;

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
        this.shapes.splice(this.shapes.indexOf(shape), 1);

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

        const index = this.selection.indexOf(shape);
        if (index >= 0) this.selection.splice(index, 1);
        if (lbI >= 0)
            visibilityStore.deleteFromTriag({
                target: TriangulationTarget.VISION,
                shape,
                standalone: true,
            });
        if (mbI >= 0)
            visibilityStore.deleteFromTriag({
                target: TriangulationTarget.MOVEMENT,
                shape,
                standalone: true,
            });

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

            const state = this;

            // We iteratre twice over all shapes
            // First to draw the auras and a second time to draw the shapes themselves
            // Otherwise auras from one shape could be overlapping another shape itself.

            this.shapes.forEach(shape => {
                if (shape.options.has("skipDraw") && shape.options.get("skipDraw")) return;
                if (layerManager.getLayer() === undefined) return;
                if (!shape.visibleInCanvas(state.canvas)) return;
                if (state.name === "fow" && shape.visionObstruction && layerManager.getLayer()!.name !== state.name)
                    return;
                shape.drawAuras(ctx);
            });
            this.shapes.forEach(shape => {
                if (shape.options.has("skipDraw") && shape.options.get("skipDraw")) return;
                if (shape.labels.length === 0 && gameStore.filterNoLabel) return;
                if (
                    shape.labels.length &&
                    gameStore.labelFilters.length &&
                    !shape.labels.some(l => gameStore.labelFilters.includes(l.uuid))
                )
                    return;
                if (layerManager.getLayer() === undefined) return;
                if (!shape.visibleInCanvas(state.canvas)) return;
                if (state.name === "fow" && shape.visionObstruction && layerManager.getLayer()!.name !== state.name)
                    return;
                shape.draw(ctx);
            });

            if (this.selection != null) {
                ctx.fillStyle = this.selectionColor;
                ctx.strokeStyle = this.selectionColor;
                ctx.lineWidth = this.selectionWidth;
                const z = gameStore.zoomFactor;
                this.selection.forEach(sel => {
                    ctx.globalCompositeOperation = sel.globalCompositeOperation;
                    const bb = sel.getBoundingBox();
                    // TODO: REFACTOR THIS TO Shape.drawSelection(ctx);
                    ctx.strokeRect(g2lx(bb.topLeft.x), g2ly(bb.topLeft.y), bb.w * z, bb.h * z);

                    for (const p of sel.points) {
                        ctx.beginPath();
                        ctx.arc(g2lx(p[0]), g2ly(p[1]), 3, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                    ctx.beginPath();
                    ctx.moveTo(g2lx(sel.points[0][0]), g2ly(sel.points[0][1]));
                    for (let i = 1; i <= sel.points.length; i++) {
                        const vertex = sel.points[i % sel.points.length];
                        ctx.lineTo(g2lx(vertex[0]), g2ly(vertex[1]));
                    }
                    ctx.stroke();
                });
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
