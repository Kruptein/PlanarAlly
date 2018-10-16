import gameManager from "../manager";
import Shape from "../shapes/shape";
import store from "../store";

import { socket } from "../comm/socket";
import { ServerShape } from "../comm/types/shapes";
import { vm } from "../planarally";
import { createShapeFromDict } from "../shapes/utils";
import { g2lx, g2ly } from "../units";

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
            gameManager.layerManager.invalidateLight();
        }
    }

    addShape(shape: Shape, sync: boolean, temporary?: boolean): void {
        if (temporary === undefined) temporary = false;
        shape.layer = this.name;
        this.shapes.push(shape);
        gameManager.layerManager.UUIDMap.set(shape.uuid, shape);
        shape.checkVisionSources();
        shape.setMovementBlock(shape.movementObstruction);
        if (shape.ownedBy(store.state.username) && shape.isToken) gameManager.ownedtokens.push(shape.uuid);
        if (shape.annotation.length) gameManager.annotations.push(shape.uuid);
        if (sync) socket.emit("Shape.Add", { shape: shape.asDict(), temporary });
        this.invalidate(!sync);
    }

    setShapes(shapes: ServerShape[]): void {
        for (const serverShape of shapes) {
            const shape = createShapeFromDict(serverShape);
            if (shape === undefined) {
                console.log(`Shape with unknown type ${serverShape.type_} could not be added`);
                return;
            }
            this.addShape(shape, false, false);
        }
        this.clearSelection(); // TODO: Fix keeping selection on those items that are not moved.
        this.invalidate(false);
    }

    removeShape(shape: Shape, sync: boolean, temporary?: boolean) {
        if (temporary === undefined) temporary = false;
        this.shapes.splice(this.shapes.indexOf(shape), 1);

        if (sync) socket.emit("Shape.Remove", { shape, temporary });
        const lsI = gameManager.visionSources.findIndex(ls => ls.shape === shape.uuid);
        const lbI = gameManager.visionBlockers.findIndex(ls => ls === shape.uuid);

        const mbI = gameManager.movementblockers.findIndex(ls => ls === shape.uuid);
        const anI = gameManager.annotations.findIndex(ls => ls === shape.uuid);
        if (lsI >= 0) gameManager.visionSources.splice(lsI, 1);
        if (lbI >= 0) gameManager.visionBlockers.splice(lbI, 1);
        if (mbI >= 0) gameManager.movementblockers.splice(mbI, 1);
        if (anI >= 0) gameManager.annotations.splice(anI, 1);

        const annotationIndex = gameManager.annotations.indexOf(shape.uuid);
        if (annotationIndex >= 0) gameManager.annotations.splice(annotationIndex, 1);

        const ownedIndex = gameManager.ownedtokens.indexOf(shape.uuid);
        if (ownedIndex >= 0) gameManager.ownedtokens.splice(ownedIndex, 1);

        gameManager.layerManager.UUIDMap.delete(shape.uuid);

        const index = this.selection.indexOf(shape);
        if (index >= 0) this.selection.splice(index, 1);
        if (lbI >= 0) gameManager.recalculateBoundingVolume();
        this.invalidate(!sync);
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    clearSelection(): void {
        this.selection = [];
        (<any>vm.$refs.selectionInfo).shape = null;
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
                if (gameManager.layerManager.getLayer() === undefined) return;
                if (!shape.visibleInCanvas(state.canvas)) return;
                if (
                    state.name === "fow" &&
                    shape.visionObstruction &&
                    gameManager.layerManager.getLayer()!.name !== state.name
                )
                    return;
                shape.drawAuras(ctx);
            });
            this.shapes.forEach(shape => {
                if (shape.options.has("skipDraw") && shape.options.get("skipDraw")) return;
                if (gameManager.layerManager.getLayer() === undefined) return;
                if (!shape.visibleInCanvas(state.canvas)) return;
                if (
                    state.name === "fow" &&
                    shape.visionObstruction &&
                    gameManager.layerManager.getLayer()!.name !== state.name
                )
                    return;
                shape.draw(ctx);
            });

            if (this.selection != null) {
                ctx.fillStyle = this.selectionColor;
                ctx.strokeStyle = this.selectionColor;
                ctx.lineWidth = this.selectionWidth;
                const z = store.state.zoomFactor;
                this.selection.forEach(sel => {
                    ctx.globalCompositeOperation = sel.globalCompositeOperation;
                    const bb = sel.getBoundingBox();
                    // TODO: REFACTOR THIS TO Shape.drawSelection(ctx);
                    ctx.strokeRect(g2lx(bb.topLeft.x), g2ly(bb.topLeft.y), bb.w * z, bb.h * z);

                    const sw = Math.min(6, bb.w / 2);

                    // topright
                    ctx.fillRect(g2lx(bb.topRight.x - sw / 2), g2ly(bb.topLeft.y - sw / 2), sw * z, sw * z);
                    // topleft
                    ctx.fillRect(g2lx(bb.topLeft.x - sw / 2), g2ly(bb.topLeft.y - sw / 2), sw * z, sw * z);
                    // botright
                    ctx.fillRect(g2lx(bb.topRight.x - sw / 2), g2ly(bb.botLeft.y - sw / 2), sw * z, sw * z);
                    // botleft
                    ctx.fillRect(g2lx(bb.topLeft.x - sw / 2), g2ly(bb.botLeft.y - sw / 2), sw * z, sw * z);
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

    onShapeMove(shape: Shape): void {
        shape.checkVisionSources();
        if (shape.visionObstruction) gameManager.recalculateBoundingVolume();
        this.invalidate(false);
    }
}
