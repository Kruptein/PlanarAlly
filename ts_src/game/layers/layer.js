import gameManager from "../planarally";
import { socket } from "../socket";
import { createShapeFromDict } from "../shapes/utils";
import { g2lx, g2ly } from "../units";
import store from "../store";
export class Layer {
    constructor(canvas, name) {
        this.selectable = false;
        this.player_editable = false;
        this.isVisionLayer = false;
        // When set to false, the layer will be redrawn on the next tick
        this.valid = false;
        // The collection of shapes that this layer contains.
        // These are ordered on a depth basis.
        this.shapes = [];
        // Collection of shapes that are currently selected
        this.selection = [];
        // Extra selection highlighting settings
        this.selectionColor = '#CC0000';
        this.selectionWidth = 2;
        this.canvas = canvas;
        this.name = name;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = canvas.getContext('2d');
    }
    invalidate(skipLightUpdate) {
        this.valid = false;
        if (!skipLightUpdate) {
            gameManager.layerManager.invalidateLight();
        }
    }
    addShape(shape, sync, temporary) {
        if (temporary === undefined)
            temporary = false;
        shape.layer = this.name;
        this.shapes.push(shape);
        gameManager.layerManager.UUIDMap.set(shape.uuid, shape);
        shape.checkLightSources();
        shape.setMovementBlock(shape.movementObstruction);
        if (shape.ownedBy(store.state.username) && shape.isToken)
            gameManager.ownedtokens.push(shape.uuid);
        if (shape.annotation.length)
            gameManager.annotations.push(shape.uuid);
        if (sync)
            socket.emit("add shape", { shape: shape.asDict(), temporary: temporary });
        this.invalidate(!sync);
    }
    setShapes(shapes) {
        for (let i = 0; i < shapes.length; i++) {
            const shape = createShapeFromDict(shapes[i]);
            if (shape === undefined) {
                console.log(`Shape with unknown type ${shapes[i].type} could not be added`);
                return;
            }
            this.addShape(shape, false, false);
        }
        this.selection = []; // TODO: Fix keeping selection on those items that are not moved.
        this.invalidate(false);
    }
    removeShape(shape, sync, temporary) {
        if (temporary === undefined)
            temporary = false;
        this.shapes.splice(this.shapes.indexOf(shape), 1);
        if (sync)
            socket.emit("remove shape", { shape: shape, temporary: temporary });
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
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    draw(doClear) {
        if (!this.valid) {
            const ctx = this.ctx;
            const ogOP = ctx.globalCompositeOperation;
            doClear = doClear === undefined ? true : doClear;
            if (doClear)
                this.clear();
            const state = this;
            this.shapes.forEach(function (shape) {
                if (shape.options.has("skipDraw") && shape.options.get("skipDraw"))
                    return;
                if (gameManager.layerManager.getLayer() === undefined)
                    return;
                if (!shape.visibleInCanvas(state.canvas))
                    return;
                if (state.name === 'fow' && shape.visionObstruction && gameManager.layerManager.getLayer().name !== state.name)
                    return;
                shape.draw(ctx);
            });
            if (this.selection != null) {
                ctx.fillStyle = this.selectionColor;
                ctx.strokeStyle = this.selectionColor;
                ctx.lineWidth = this.selectionWidth;
                const z = store.state.zoomFactor;
                this.selection.forEach(function (sel) {
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
    moveShapeOrder(shape, destinationIndex, sync) {
        const oldIdx = this.shapes.indexOf(shape);
        if (oldIdx === destinationIndex)
            return;
        this.shapes.splice(oldIdx, 1);
        this.shapes.splice(destinationIndex, 0, shape);
        if (sync)
            socket.emit("moveShapeOrder", { shape: shape.asDict(), index: destinationIndex });
        this.invalidate(true);
    }
    ;
    onShapeMove(shape) {
        shape.checkLightSources();
        if (shape.visionObstruction)
            gameManager.recalculateBoundingVolume();
        this.invalidate(false);
    }
}
//# sourceMappingURL=layer.js.map