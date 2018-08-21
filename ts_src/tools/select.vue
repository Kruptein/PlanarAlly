<template>
    <ContextMenu ref="selectcontext"></ContextMenu>
</template>

<script lang="ts">
import Vue from "vue";
import Tool from "./tool.vue";
import ContextMenu from "./selectcontext.vue";

import Rect from "../shapes/rect";
import { GlobalPoint, Vector, LocalPoint, Ray } from "../geom";
import Settings from "../settings";
import gameManager,{ vm } from "../planarally";
import { getMouse } from "../utils";
import { l2g, g2l, g2lx, g2ly } from "../units";
import { calculateDelta } from "./utils";
import { socket } from "../socket";

export enum SelectOperations {
    Noop,
    Resize,
    Drag,
    GroupSelect,
}

export default Tool.extend({
    components: {
        ContextMenu
    },
    // data() {
    data() {
        const start = new GlobalPoint(-1000, -1000);
        return {
            name: "select",
            showContextMenu: false,
            
            mode: SelectOperations.Noop,
            resizeDirection: "",
            deltaChanged: false,
            // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
            // we keep track of the actual offset within the asset.
            dragRay: new Ray<LocalPoint>(new LocalPoint(0, 0), new Vector(0, 0)),
            selectionStartPoint: start,
            selectionHelper: new Rect(start, 0, 0),
        }
    },
    created() {
        this.selectionHelper.owners.push(Settings.username);
        this.selectionHelper.globalCompositeOperation = "source-over";
    },
    methods: {
        onMouseDown(event: MouseEvent) {
            const layer = gameManager.layerManager.getLayer();
            if (layer === undefined) {
                console.log("No active layer!");
                return;
            }
            const mouse = getMouse(event);
            const globalMouse = l2g(mouse);

            let hit = false;
            // The selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
            let selectionStack;
            if (!layer.selection.length)
                selectionStack = layer.shapes;
            else
                selectionStack = layer.shapes.concat(layer.selection);
            for (let i = selectionStack.length - 1; i >= 0; i--) {
                const shape = selectionStack[i];

                if (!shape.ownedBy()) continue;

                const corner = shape.getBoundingBox().getCorner(globalMouse);

                // Resize case, a corner is selected
                if (corner !== undefined) {
                    layer.selection = [shape];
                    (<any>vm.$refs.selectionInfo).shape = shape;
                    this.mode = SelectOperations.Resize;
                    this.resizeDirection = corner;
                    layer.invalidate(true);
                    hit = true;
                    break;
                
                // Drag case, a shape is selected
                } else if (shape.contains(globalMouse)) {
                    const selection = shape;
                    if (layer.selection.indexOf(selection) === -1) {
                        layer.selection = [selection];
                        (<any>vm.$refs.selectionInfo).shape = selection;
                    }
                    this.mode = SelectOperations.Drag;
                    const localRefPoint = g2l(selection.refPoint);
                    this.dragRay = new Ray<LocalPoint>(
                        localRefPoint,
                        mouse.subtract(localRefPoint)
                    );
                    layer.invalidate(true);
                    hit = true;
                    break;
                }
            }

            // GroupSelect case, draw a selection box to select multiple shapes
            if (!hit) {
                this.mode = SelectOperations.GroupSelect;
                for (let selection of layer.selection) {
                    (<any>vm.$refs.selectionInfo).shape = selection;
                }
                this.selectionStartPoint = globalMouse;
                
                this.selectionHelper.refPoint = this.selectionStartPoint;
                this.selectionHelper.w = 0;
                this.selectionHelper.h = 0;

                layer.selection = [this.selectionHelper];
                layer.invalidate(true);
            }
        },
        onMouseMove(event: MouseEvent) {
            const layer = gameManager.layerManager.getLayer();
            if (layer === undefined) {
                console.log("No active layer!");
                return;
            }
            const mouse = getMouse(event);
            const globalMouse = l2g(mouse);
            this.deltaChanged = false;

            if (this.mode === SelectOperations.GroupSelect) {
                // Currently draw on active layer
                const endPoint = globalMouse;

                this.selectionHelper.w = Math.abs(endPoint.x - this.selectionStartPoint.x);
                this.selectionHelper.h = Math.abs(endPoint.y - this.selectionStartPoint.y);
                this.selectionHelper.refPoint = new GlobalPoint(
                    Math.min(this.selectionStartPoint.x, endPoint.x),
                    Math.min(this.selectionStartPoint.y, endPoint.y)
                );
                layer.invalidate(true);
            } else if (layer.selection.length) {
                const og = g2l(layer.selection[layer.selection.length - 1].refPoint);
                const origin = og.add(this.dragRay.direction);
                let delta = mouse.subtract(origin).multiply(1/Settings.zoomFactor);
                const ogDelta = delta;
                if (this.mode === SelectOperations.Drag) {
                    // If we are on the tokens layer do a movement block check.
                    if (layer.name === 'tokens' && !(event.shiftKey && Settings.IS_DM)) {
                        for (let i = 0; i < layer.selection.length; i++) {
                            const sel = layer.selection[i];
                            if (sel.uuid === this.selectionHelper.uuid) continue; // the selection helper should not be treated as a real shape.
                            delta = calculateDelta(delta, sel);
                            if (delta !== ogDelta) this.deltaChanged = true;
                        }
                    }
                    // Actually apply the delta on all shapes
                    for (let i = 0; i < layer.selection.length; i++) {
                        const sel = layer.selection[i];
                        sel.refPoint = sel.refPoint.add(delta);
                        if (sel !== this.selectionHelper) {
                            if (sel.visionObstruction) gameManager.recalculateBoundingVolume();
                            socket.emit("shapeMove", { shape: sel.asDict(), temporary: true });
                        }
                    }
                    layer.invalidate(false);
                } else if (this.mode === SelectOperations.Resize) {
                    for (let i = 0; i < layer.selection.length; i++) {
                        const sel = layer.selection[i];
                        sel.resize(this.resizeDirection, mouse);
                        if (sel !== this.selectionHelper) {
                            if (sel.visionObstruction) gameManager.recalculateBoundingVolume();
                            socket.emit("shapeMove", { shape: sel.asDict(), temporary: true });
                        }
                        layer.invalidate(false);
                    }
                } else {
                    for (let i = 0; i < layer.selection.length; i++) {
                        const sel = layer.selection[i];
                        const bb = sel.getBoundingBox();
                        const gm = globalMouse;
                        if (bb.inCorner(gm, "nw")) {
                            document.body.style.cursor = "nw-resize";
                        } else if (bb.inCorner(gm, "ne")) {
                            document.body.style.cursor = "ne-resize";
                        } else if (bb.inCorner(gm, "se")) {
                            document.body.style.cursor = "se-resize";
                        } else if (bb.inCorner(gm, "sw")) {
                            document.body.style.cursor = "sw-resize";
                        } else {
                            document.body.style.cursor = "default";
                        }
                    }
                };
            } else {
                document.body.style.cursor = "default";
            }
        },
        onMouseUp(e: MouseEvent): void {
            if (gameManager.layerManager.getLayer() === undefined) {
                console.log("No active layer!");
                return;
            }
            const layer = gameManager.layerManager.getLayer()!;
            
            if (this.mode === SelectOperations.GroupSelect) {
                layer.selection = [];
                layer.shapes.forEach((shape) => {
                    if (shape === this.selectionHelper) return;
                    const bbox = shape.getBoundingBox();
                    if (!shape.ownedBy()) return;
                    if (this.selectionHelper!.refPoint.x <= bbox.topRight.x &&
                        this.selectionHelper!.refPoint.x + this.selectionHelper!.w >= bbox.topLeft.x &&
                        this.selectionHelper!.refPoint.y <= bbox.botLeft.y &&
                        this.selectionHelper!.refPoint.y + this.selectionHelper!.h >= bbox.topLeft.y) {
                        layer.selection.push(shape);
                    }
                });

                // Push the selection helper as the last element of the selection
                // This makes sure that it will be the first one to be hit in the hit detection onMouseDown
                if (layer.selection.length > 0)
                    layer.selection.push(this.selectionHelper);

                layer.invalidate(true);
            } else if (layer.selection.length) {
                layer.selection.forEach((sel) => {
                    if (this.mode === SelectOperations.Drag) {
                        if (
                            this.dragRay.origin!.x === g2lx(sel.refPoint.x) &&
                            this.dragRay.origin!.y === g2ly(sel.refPoint.y)
                        ) return;

                        if (Settings.useGrid && !e.altKey && !this.deltaChanged) {
                            sel.snapToGrid();
                        }

                        if (sel !== this.selectionHelper) {
                            if (sel.visionObstruction) gameManager.recalculateBoundingVolume();
                            socket.emit("shapeMove", { shape: sel.asDict(), temporary: false });
                        }
                        layer.invalidate(false);
                    }
                    if (this.mode === SelectOperations.Resize) {
                        if (Settings.useGrid && !e.altKey) {
                            sel.resizeToGrid();
                        }
                        if (sel !== this.selectionHelper) {
                            if (sel.visionObstruction) gameManager.recalculateBoundingVolume();
                            socket.emit("shapeMove", { shape: sel.asDict(), temporary: false });
                        }
                        layer.invalidate(false);
                    }
                });
            }
            this.mode = SelectOperations.Noop
        },
        onContextMenu(event: MouseEvent) {
            if (gameManager.layerManager.getLayer() === undefined) {
                console.log("No active layer!");
                return;
            }
            const layer = gameManager.layerManager.getLayer()!;
            const mouse = getMouse(event);
            const globalMouse = l2g(mouse);

            for (let shape of layer.selection) {
                if (shape.contains(globalMouse)) {
                    layer.selection = [shape];
                    (<any>vm.$refs.selectionInfo).shape = shape;
                    layer.invalidate(true);
                    (<any>this.$parent.$refs.shapecontext).open(event, shape);
                    return;
                }
            }
            (<any>this.$refs.selectcontext).open(event);
        }
    }
})
</script>