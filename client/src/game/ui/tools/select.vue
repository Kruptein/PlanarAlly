<script lang="ts">
import Component from "vue-class-component";

import ShapeContext from "@/game/ui/selection/shapecontext.vue";
import DefaultContext from "@/game/ui/tools/defaultcontext.vue";
import Tool from "@/game/ui/tools/tool.vue";

import { socket } from "@/game/api/socket";
import { GlobalPoint, LocalPoint, Ray, Vector } from "@/game/geom";
import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { Rect } from "@/game/shapes/rect";
import { gameStore } from "@/game/store";
import { calculateDelta } from "@/game/ui/tools/utils";
import { g2l, g2lx, g2ly, l2g, l2gz } from "@/game/units";
import { getMouse } from "@/game/utils";
import { EventBus } from "../../event-bus";
import { visibilityStore } from "../../visibility/store";

export enum SelectOperations {
    Noop,
    Resize,
    Drag,
    GroupSelect,
}

const start = new GlobalPoint(-1000, -1000);

@Component
export default class SelectTool extends Tool {
    name = "Select";
    showContextMenu = false;
    active = false;

    mode = SelectOperations.Noop;
    resizePoint = 0;
    deltaChanged = false;
    // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
    // we keep track of the actual offset within the asset.
    dragRay = new Ray<LocalPoint>(new LocalPoint(0, 0), new Vector(0, 0));
    selectionStartPoint = start;
    selectionHelper = new Rect(start, 0, 0);
    created() {
        this.selectionHelper.globalCompositeOperation = "source-over";
        gameStore.setSelectionHelperId(this.selectionHelper.uuid);
    }
    onMouseDown(event: MouseEvent) {
        const layer = layerManager.getLayer();
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        if (!this.selectionHelper.owners.includes(gameStore.username)) {
            this.selectionHelper.addOwner(gameStore.username);
        }

        const mouse = getMouse(event);
        const globalMouse = l2g(mouse);

        let hit = false;
        // The selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
        let selectionStack;
        if (!layer.selection.length) selectionStack = layer.shapes;
        else selectionStack = layer.shapes.concat(layer.selection);
        for (let i = selectionStack.length - 1; i >= 0; i--) {
            const shape = selectionStack[i];

            this.resizePoint = shape.getPointIndex(globalMouse, l2gz(3));

            // Resize case, a corner is selected
            if (this.resizePoint >= 0) {
                layer.selection = [shape];
                EventBus.$emit("SelectionInfo.Shape.Set", shape);
                this.mode = SelectOperations.Resize;
                layer.invalidate(true);
                hit = true;
                break;

                // Drag case, a shape is selected
            } else if (shape.contains(globalMouse)) {
                const selection = shape;
                if (layer.selection.indexOf(selection) === -1) {
                    if (event.shiftKey || event.ctrlKey) {
                        layer.selection.push(selection);
                    } else {
                        layer.selection = [selection];
                    }
                    EventBus.$emit("SelectionInfo.Shape.Set", selection);
                }
                this.mode = SelectOperations.Drag;
                const localRefPoint = g2l(selection.refPoint);
                this.dragRay = new Ray<LocalPoint>(localRefPoint, mouse.subtract(localRefPoint));
                layer.invalidate(true);
                hit = true;
                break;
            }
        }

        // GroupSelect case, draw a selection box to select multiple shapes
        if (!hit) {
            this.mode = SelectOperations.GroupSelect;
            for (const selection of layer.selection) EventBus.$emit("SelectionInfo.Shape.Set", selection);

            this.selectionStartPoint = globalMouse;

            this.selectionHelper.refPoint = this.selectionStartPoint;
            this.selectionHelper.w = 0;
            this.selectionHelper.h = 0;

            if (event.shiftKey || event.ctrlKey) {
                layer.selection.push(this.selectionHelper);
            } else {
                layer.selection = [this.selectionHelper];
            }
            layer.invalidate(true);
        }
        this.active = true;
    }
    onMouseMove(event: MouseEvent) {
        // if (!this.active) return;   we require mousemove for the resize cursor
        const layer = layerManager.getLayer();
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
                Math.min(this.selectionStartPoint.y, endPoint.y),
            );
            layer.invalidate(true);
        } else if (layer.selection.length) {
            const og = g2l(layer.selection[layer.selection.length - 1].refPoint);
            const origin = og.add(this.dragRay.direction);
            let delta = mouse.subtract(origin).multiply(1 / gameStore.zoomFactor);
            const ogDelta = delta;
            if (this.mode === SelectOperations.Drag) {
                // If we are on the tokens layer do a movement block check.
                if (layer.name === "tokens" && !(event.shiftKey && gameStore.IS_DM)) {
                    for (const sel of layer.selection) {
                        if (!sel.ownedBy()) continue;
                        if (sel.uuid === this.selectionHelper.uuid) continue; // the selection helper should not be treated as a real shape.
                        delta = calculateDelta(delta, sel);
                        if (delta !== ogDelta) this.deltaChanged = true;
                    }
                }
                // Actually apply the delta on all shapes
                for (const sel of layer.selection) {
                    if (!sel.ownedBy()) continue;
                    sel.refPoint = sel.refPoint.add(delta);
                    if (sel !== this.selectionHelper) {
                        if (sel.visionObstruction) visibilityStore.recalculateVision();
                        socket.emit("Shape.Update", { shape: sel.asDict(), redraw: true, temporary: true });
                    }
                }
                layer.invalidate(false);
            } else if (this.mode === SelectOperations.Resize) {
                for (const sel of layer.selection) {
                    if (!sel.ownedBy()) continue;
                    sel.resize(this.resizePoint, mouse);
                    if (sel !== this.selectionHelper) {
                        if (sel.visionObstruction) visibilityStore.recalculateVision();
                        socket.emit("Shape.Update", { shape: sel.asDict(), redraw: true, temporary: true });
                    }
                    layer.invalidate(false);
                    this.updateCursor(layer, globalMouse);
                }
            } else {
                this.updateCursor(layer, globalMouse);
            }
        } else {
            document.body.style.cursor = "default";
        }
    }
    onMouseUp(e: MouseEvent): void {
        if (!this.active) return;
        if (layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = layerManager.getLayer()!;

        if (this.mode === SelectOperations.GroupSelect) {
            if (e.shiftKey || e.ctrlKey) {
                // If either control or shift are pressed, do not remove selection
            } else {
                layer.clearSelection();
            }
            layer.shapes.forEach(shape => {
                if (!shape.ownedBy()) return;
                if (shape === this.selectionHelper) return;
                const bbox = shape.getBoundingBox();
                if (!shape.ownedBy()) return;
                if (
                    this.selectionHelper!.refPoint.x <= bbox.topRight.x &&
                    this.selectionHelper!.refPoint.x + this.selectionHelper!.w >= bbox.topLeft.x &&
                    this.selectionHelper!.refPoint.y <= bbox.botLeft.y &&
                    this.selectionHelper!.refPoint.y + this.selectionHelper!.h >= bbox.topLeft.y
                ) {
                    if (layer.selection.find(it => it == shape) === undefined) {
                        layer.selection.push(shape);
                    }
                }
            });
            layer.selection = layer.selection.filter(it => it != this.selectionHelper);
            layer.invalidate(true);
        } else if (layer.selection.length) {
            layer.selection.forEach(sel => {
                if (!sel.ownedBy()) return;
                if (this.mode === SelectOperations.Drag) {
                    if (
                        this.dragRay.origin!.x === g2lx(sel.refPoint.x) &&
                        this.dragRay.origin!.y === g2ly(sel.refPoint.y)
                    )
                        return;

                    if (gameStore.useGrid && !e.altKey && !this.deltaChanged) {
                        sel.snapToGrid();
                    }

                    if (sel !== this.selectionHelper) {
                        if (sel.visionObstruction) visibilityStore.recalculateVision();
                        if (sel.movementObstruction) visibilityStore.recalculateMovement();
                        socket.emit("Shape.Update", { shape: sel.asDict(), redraw: true, temporary: false });
                    }
                    layer.invalidate(false);
                }
                if (this.mode === SelectOperations.Resize) {
                    if (gameStore.useGrid && !e.altKey) {
                        sel.resizeToGrid();
                    }
                    if (sel !== this.selectionHelper) {
                        if (sel.visionObstruction) visibilityStore.recalculateVision();
                        if (sel.movementObstruction) visibilityStore.recalculateMovement();
                        socket.emit("Shape.Update", { shape: sel.asDict(), redraw: true, temporary: false });
                    }
                    layer.invalidate(false);
                }
            });
        }
        this.mode = SelectOperations.Noop;
        this.active = false;
    }
    onContextMenu(event: MouseEvent) {
        if (layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = layerManager.getLayer()!;
        const mouse = getMouse(event);
        const globalMouse = l2g(mouse);
        for (const shape of layer.selection) {
            if (shape.contains(globalMouse)) {
                EventBus.$emit("SelectionInfo.Shape.Set", shape);
                layer.invalidate(true);
                (<ShapeContext>this.$parent.$refs.shapecontext).open(event);
                return;
            }
        }

        // Check if any other shapes are under the mouse
        for (let i = layer.shapes.length - 1; i >= 0; i--) {
            const shape = layer.shapes[i];
            if (shape.contains(globalMouse)) {
                layer.selection = [shape];
                EventBus.$emit("SelectionInfo.Shape.Set", shape);
                layer.invalidate(true);
                (<ShapeContext>this.$parent.$refs.shapecontext).open(event);
                return;
            }
        }
        (<DefaultContext>this.$parent.$refs.defaultcontext).open(event);
    }
    updateCursor(layer: Layer, globalMouse: GlobalPoint) {
        for (const sel of layer.selection) {
            const resizePoint = sel.getPointIndex(globalMouse, l2gz(3));
            if (resizePoint < 0) document.body.style.cursor = "default";
            else {
                let angle = sel.getPointOrientation(resizePoint).angle();
                if (angle < 0) angle += 360;
                const d = 45 / 2;
                if (angle >= 315 + d || angle < d || (angle >= 135 + d && angle < 225 - d))
                    document.body.style.cursor = "ew-resize";
                if ((angle >= 45 + d && angle < 135 - d) || (angle >= 225 + d && angle < 315 - d))
                    document.body.style.cursor = "ns-resize";
                if ((angle >= d && angle < 90 - d) || (angle >= 180 + d && angle < 270 - d))
                    document.body.style.cursor = "nwse-resize";
                if ((angle >= 90 + d && angle < 180 - d) || (angle >= 270 + d && angle < 360 - d))
                    document.body.style.cursor = "nesw-resize";
            }
        }
    }
}
</script>
