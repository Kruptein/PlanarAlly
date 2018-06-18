import Shape from "../shapes/shape";
import gameManager from "../planarally";
import Settings from "../settings";
import { socket } from "../socket";
import { ServerShape } from "../api_types";
import { createShapeFromDict } from "../shapes/utils";
import { g2lx, g2ly } from "../units";

export class Layer {
    name: string;
    width: number;
    height: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    selectable: boolean = false;
    player_editable: boolean = false;
    isVisionLayer: boolean = false;

    // When set to false, the layer will be redrawn on the next tick
    valid: boolean = false;
    // The collection of shapes that this layer contains.
    // These are ordered on a depth basis.
    shapes: Shape[] = [];

    // Collection of shapes that are currently selected
    selection: Shape[] = [];

    // Extra selection highlighting settings
    selectionColor = '#CC0000';
    selectionWidth = 2;

    constructor(canvas: HTMLCanvasElement, name: string) {
        this.canvas = canvas;
        this.name = name;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = canvas.getContext('2d')!;
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
        shape.checkLightSources();
        shape.setMovementBlock(shape.movementObstruction);
        if (shape.ownedBy(Settings.username) && shape.isToken)
            gameManager.ownedtokens.push(shape.uuid);
        if (shape.annotation.length)
            gameManager.annotations.push(shape.uuid);
        if (sync) socket.emit("add shape", {shape: shape.asDict(), temporary: temporary});
        this.invalidate(!sync);
    }

    setShapes(shapes: ServerShape[]): void {
        const t: Shape[] = [];
        const self = this;
        shapes.forEach(function (shape) {
            const sh = createShapeFromDict(shape);
            if (sh === undefined) {
                console.log(`Shape with unknown type ${shape.type} could not be added`);
                return ;
            }
            sh.layer = self.name;
            t.push(sh);
            gameManager.layerManager.UUIDMap.set(shape.uuid, sh);
            sh.checkLightSources();
            sh.setMovementBlock(shape.movementObstruction);
            if (sh.ownedBy() && sh.isToken)
                gameManager.ownedtokens.push(sh.uuid);
            if (sh.annotation.length)
                gameManager.annotations.push(sh.uuid);
        });
        this.selection = []; // TODO: Fix keeping selection on those items that are not moved.
        this.shapes = t;
        this.invalidate(false);
    }

    removeShape(shape: Shape, sync: boolean, temporary?: boolean) {
        if (temporary === undefined) temporary = false;
        this.shapes.splice(this.shapes.indexOf(shape), 1);
        if (sync) socket.emit("remove shape", {shape: shape, temporary: temporary});
        const ls_i = gameManager.lightsources.findIndex(ls => ls.shape === shape.uuid);
        const lb_i = gameManager.lightblockers.findIndex(ls => ls === shape.uuid);
        const mb_i = gameManager.movementblockers.findIndex(ls => ls === shape.uuid);
        const an_i = gameManager.annotations.findIndex(ls => ls === shape.uuid);
        if (ls_i >= 0)
            gameManager.lightsources.splice(ls_i, 1);
        if (lb_i >= 0)
            gameManager.lightblockers.splice(lb_i, 1);
        if (mb_i >= 0)
            gameManager.movementblockers.splice(mb_i, 1);
        if (an_i >= 0)
            gameManager.annotations.splice(an_i, 1);
        
        const annotation_i = gameManager.annotations.indexOf(shape.uuid);
        if (annotation_i >= 0)
            gameManager.annotations.splice(annotation_i, 1);
        
        const owned_i = gameManager.ownedtokens.indexOf(shape.uuid);
        if (owned_i >= 0)
            gameManager.ownedtokens.splice(owned_i, 1);

        gameManager.layerManager.UUIDMap.delete(shape.uuid);

        const index = this.selection.indexOf(shape);
        if (index >= 0)
            this.selection.splice(index, 1);
        if (lb_i >= 0)
            gameManager.recalculateBoundingVolume();
        this.invalidate(!sync);
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    draw(doClear?: boolean): void {
        if (Settings.board_initialised && !this.valid) {
            const ctx = this.ctx;
            doClear = doClear === undefined ? true : doClear;

            if (doClear)
                this.clear();

            const state = this;

            this.shapes.forEach(function (shape) {
                if (gameManager.layerManager.getLayer() === undefined) return;
                if (!shape.visibleInCanvas(state.canvas)) return;
                if (state.name === 'fow' && shape.visionObstruction && gameManager.layerManager.getLayer()!.name !== state.name) return;
                shape.draw(ctx);
            });

            if (this.selection != null) {
                ctx.fillStyle = this.selectionColor;
                ctx.strokeStyle = this.selectionColor;
                ctx.lineWidth = this.selectionWidth;
                const z = Settings.zoomFactor;
                this.selection.forEach(function (sel) {
                    const bb = sel.getBoundingBox();
                    // TODO: REFACTOR THIS TO Shape.drawSelection(ctx);
                    ctx.strokeRect(g2lx(bb.topLeft.x), g2ly(bb.topLeft.y), bb.w * z, bb.h * z);

                    const sw = Math.min(6, bb.w / 2)

                    // topright
                    ctx.fillRect(g2lx(bb.topRight.x - sw/2), g2ly(bb.topLeft.y - sw/2), sw * z, sw * z);
                    // topleft
                    ctx.fillRect(g2lx(bb.topLeft.x - sw/2), g2ly(bb.topLeft.y - sw/2), sw * z, sw * z);
                    // botright
                    ctx.fillRect(g2lx(bb.topRight.x - sw/2), g2ly(bb.botLeft.y - sw/2), sw * z, sw * z);
                    // botleft
                    ctx.fillRect(g2lx(bb.topLeft.x - sw/2), g2ly(bb.botLeft.y - sw/2), sw * z, sw * z)
                });
            }

            this.valid = true;
        }
    }

    moveShapeOrder(shape: Shape, destinationIndex: number, sync: boolean): void {
        const oldIdx = this.shapes.indexOf(shape);
        if (oldIdx === destinationIndex) return;
        this.shapes.splice(oldIdx, 1);
        this.shapes.splice(destinationIndex, 0, shape);
        if (sync) socket.emit("moveShapeOrder", {shape: shape.asDict(), index: destinationIndex});
        this.invalidate(true);
    };

    onShapeMove(shape: Shape): void {
        shape.checkLightSources();
        if (shape.visionObstruction)
            gameManager.recalculateBoundingVolume();
        this.invalidate(false);
    }
}