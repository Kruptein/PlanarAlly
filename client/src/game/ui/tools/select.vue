<script lang="ts">
import Component from "vue-class-component";

import ShapeContext from "@/game/ui/selection/shapecontext.vue";
import Tool from "@/game/ui/tools/tool.vue";

import { socket } from "@/game/api/socket";
import { EventBus } from "@/game/event-bus";
import { GlobalPoint, LocalPoint, Ray, Vector } from "@/game/geom";
import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { snapToPoint } from "@/game/layers/utils";
import { Rect } from "@/game/shapes/rect";
import { gameStore } from "@/game/store";
import { calculateDelta, ToolName, ToolFeatures } from "@/game/ui/tools/utils";
import { g2l, g2lx, g2ly, l2g, l2gz } from "@/game/units";
import { getLocalPointFromEvent, useSnapping } from "@/game/utils";
import { visibilityStore } from "@/game/visibility/store";
import { TriangulationTarget } from "@/game/visibility/te/pa";
import { gameSettingsStore } from "../../settings";
import { ToolBasics } from "./ToolBasics";

enum SelectOperations {
    Noop,
    Resize,
    Drag,
    GroupSelect,
}

export enum SelectFeatures {
    ChangeSelection,
    Context,
    Drag,
    GroupSelect,
    Resize,
    Snapping,
}

const start = new GlobalPoint(-1000, -1000);

@Component
export default class SelectTool extends Tool implements ToolBasics {
    name = ToolName.Select;
    showContextMenu = false;
    active = false;

    mode = SelectOperations.Noop;
    resizePoint = 0;
    originalResizePoints: number[][] = [];
    deltaChanged = false;
    // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
    // we keep track of the actual offset within the asset.
    dragRay = new Ray<LocalPoint>(new LocalPoint(0, 0), new Vector(0, 0));
    selectionStartPoint = start;
    selectionHelper = new Rect(start, 0, 0);

    created(): void {
        this.selectionHelper.globalCompositeOperation = "source-over";
        gameStore.setSelectionHelperId(this.selectionHelper.uuid);
    }

    onDown(lp: LocalPoint, event: MouseEvent | TouchEvent, features: ToolFeatures<SelectFeatures>): void {
        const gp = l2g(lp);
        const layer = layerManager.getLayer(layerManager.floor!.name);
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        if (!this.selectionHelper.hasOwner(gameStore.username)) {
            this.selectionHelper.addOwner({ user: gameStore.username, access: { edit: true } }, false);
        }

        let hit = false;

        // The selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
        let selectionStack;
        if (!this.hasFeature(SelectFeatures.ChangeSelection, features)) selectionStack = layer.selection;
        else if (!layer.selection.length) selectionStack = layer.shapes;
        else selectionStack = layer.shapes.concat(layer.selection);

        for (let i = selectionStack.length - 1; i >= 0; i--) {
            const shape = selectionStack[i];
            if (shape.isInvisible && !shape.ownedBy({ movementAccess: true })) continue;

            this.resizePoint = shape.getPointIndex(gp, l2gz(5));

            if (this.resizePoint >= 0 && this.hasFeature(SelectFeatures.Resize, features)) {
                // Resize case, a corner is selected
                layer.selection = [shape];
                this.originalResizePoints = shape.points;
                EventBus.$emit("SelectionInfo.Shape.Set", shape);
                this.mode = SelectOperations.Resize;
                layer.invalidate(true);
                hit = true;
                break;
            } else if (shape.contains(gp)) {
                const selection = shape;
                if (layer.selection.indexOf(selection) === -1) {
                    if (event.ctrlKey) {
                        layer.selection.push(selection);
                    } else {
                        layer.selection = [selection];
                    }
                    EventBus.$emit("SelectionInfo.Shape.Set", selection);
                }
                // Drag case, a shape is selected
                if (this.hasFeature(SelectFeatures.Drag, features)) {
                    this.mode = SelectOperations.Drag;
                    const localRefPoint = g2l(selection.refPoint);
                    this.dragRay = Ray.fromPoints(localRefPoint, lp);
                }
                layer.invalidate(true);
                hit = true;
                break;
            }
        }

        // GroupSelect case, draw a selection box to select multiple shapes
        if (!hit) {
            if (!this.hasFeature(SelectFeatures.ChangeSelection, features)) return;
            if (!this.hasFeature(SelectFeatures.GroupSelect, features)) return;
            this.mode = SelectOperations.GroupSelect;
            for (const selection of layer.selection) EventBus.$emit("SelectionInfo.Shape.Set", selection);

            this.selectionStartPoint = gp;

            this.selectionHelper.refPoint = this.selectionStartPoint;
            this.selectionHelper.w = 0;
            this.selectionHelper.h = 0;

            if (event.ctrlKey) {
                layer.selection.push(this.selectionHelper);
            } else {
                layer.selection = [this.selectionHelper];
            }
            layer.invalidate(true);
        }
        if (this.mode !== SelectOperations.Noop) this.active = true;
    }

    onMove(lp: LocalPoint, event: MouseEvent | TouchEvent, features: ToolFeatures<SelectFeatures>): void {
        const gp = l2g(lp);
        // We require move for the resize cursor
        if (!this.active && !this.hasFeature(SelectFeatures.Resize, features)) return;

        const layer = layerManager.getLayer(layerManager.floor!.name);
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        if (layer.selection.some(s => s.isLocked)) return;

        this.deltaChanged = false;

        if (this.mode === SelectOperations.GroupSelect) {
            // Currently draw on active layer
            const endPoint = gp;

            this.selectionHelper.w = Math.abs(endPoint.x - this.selectionStartPoint.x);
            this.selectionHelper.h = Math.abs(endPoint.y - this.selectionStartPoint.y);
            this.selectionHelper.refPoint = new GlobalPoint(
                Math.min(this.selectionStartPoint.x, endPoint.x),
                Math.min(this.selectionStartPoint.y, endPoint.y),
            );
            layer.invalidate(true);
        } else if (layer.selection.length) {
            let delta = Ray.fromPoints(this.dragRay.get(this.dragRay.tMax), lp).direction.multiply(
                1 / gameStore.zoomFactor,
            );
            const ogDelta = delta;
            if (this.mode === SelectOperations.Drag) {
                if (ogDelta.length() === 0) return;
                // If we are on the tokens layer do a movement block check.
                if (layer.name === "tokens" && !(event.shiftKey && gameStore.IS_DM)) {
                    for (const sel of layer.selection) {
                        if (!sel.ownedBy({ movementAccess: true })) continue;
                        if (sel.uuid === this.selectionHelper.uuid) continue; // the selection helper should not be treated as a real shape.
                        delta = calculateDelta(delta, sel, true);
                        if (delta !== ogDelta) this.deltaChanged = true;
                    }
                }
                // Actually apply the delta on all shapes
                for (const sel of layer.selection) {
                    if (!sel.ownedBy({ movementAccess: true })) continue;
                    if (sel.visionObstruction)
                        visibilityStore.deleteFromTriag({
                            target: TriangulationTarget.VISION,
                            shape: sel,
                        });
                    sel.refPoint = sel.refPoint.add(delta);
                    if (sel.visionObstruction) {
                        visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: sel });
                        visibilityStore.recalculateVision(sel.floor);
                    }
                    if (sel !== this.selectionHelper) {
                        if (sel.visionObstruction) visibilityStore.recalculateVision(sel.floor);
                        if (!sel.preventSync)
                            socket.emit("Shape.Update", { shape: sel.asDict(), redraw: true, temporary: true });
                    }
                }
                this.dragRay = Ray.fromPoints(this.dragRay.origin, lp);
                layer.invalidate(false);
            } else if (this.mode === SelectOperations.Resize) {
                for (const sel of layer.selection) {
                    if (!sel.ownedBy({ movementAccess: true })) continue;
                    if (sel.visionObstruction)
                        visibilityStore.deleteFromTriag({
                            target: TriangulationTarget.VISION,
                            shape: sel,
                        });
                    let ignorePoint: GlobalPoint | undefined;
                    if (this.resizePoint >= 0)
                        ignorePoint = GlobalPoint.fromArray(this.originalResizePoints[this.resizePoint]);
                    let targetPoint = gp;
                    if (useSnapping(event) && this.hasFeature(SelectFeatures.Snapping, features))
                        targetPoint = snapToPoint(layerManager.getLayer(layerManager.floor!.name)!, gp, ignorePoint);
                    this.resizePoint = sel.resize(this.resizePoint, targetPoint, event.ctrlKey);
                    if (sel !== this.selectionHelper) {
                        // todo: think about calling deleteIntersectVertex directly on the corner point
                        if (sel.visionObstruction) {
                            visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: sel });
                            visibilityStore.recalculateVision(sel.floor);
                        }
                        if (!sel.preventSync)
                            socket.emit("Shape.Update", { shape: sel.asDict(), redraw: true, temporary: true });
                    }
                    layer.invalidate(false);
                    this.updateCursor(layer, gp);
                }
            } else {
                this.updateCursor(layer, gp);
            }
        } else {
            document.body.style.cursor = "default";
        }
    }

    onUp(_lp: LocalPoint, event: MouseEvent | TouchEvent, features: ToolFeatures<SelectFeatures>): void {
        if (!this.active) return;
        if (layerManager.getLayer(layerManager.floor!.name) === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = layerManager.getLayer(layerManager.floor!.name)!;
        if (layer.selection.some(s => s.isLocked)) return;

        if (this.mode === SelectOperations.GroupSelect) {
            if (event.ctrlKey) {
                // If either control or shift are pressed, do not remove selection
            } else {
                layer.clearSelection();
            }
            for (const shape of layer.shapes) {
                if (!shape.ownedBy({ movementAccess: true })) continue;
                if (shape === this.selectionHelper) continue;
                const bbox = shape.getBoundingBox();
                if (!shape.ownedBy({ movementAccess: true })) continue;
                if (
                    this.selectionHelper!.refPoint.x <= bbox.topRight.x &&
                    this.selectionHelper!.refPoint.x + this.selectionHelper!.w >= bbox.topLeft.x &&
                    this.selectionHelper!.refPoint.y <= bbox.botLeft.y &&
                    this.selectionHelper!.refPoint.y + this.selectionHelper!.h >= bbox.topLeft.y
                ) {
                    if (layer.selection.find(it => it === shape) === undefined) {
                        layer.selection.push(shape);
                    }
                }
            }
            layer.selection = layer.selection.filter(it => it !== this.selectionHelper);
            if (layer.selection.some(s => !s.isLocked)) layer.selection = layer.selection.filter(s => !s.isLocked);
            layer.invalidate(true);
        } else if (layer.selection.length) {
            for (const sel of layer.selection) {
                if (!sel.ownedBy({ movementAccess: true })) continue;
                if (this.mode === SelectOperations.Drag) {
                    if (
                        this.dragRay.origin!.x === g2lx(sel.refPoint.x) &&
                        this.dragRay.origin!.y === g2ly(sel.refPoint.y)
                    )
                        continue;

                    if (
                        gameSettingsStore.useGrid &&
                        useSnapping(event) &&
                        this.hasFeature(SelectFeatures.Snapping, features) &&
                        !this.deltaChanged
                    ) {
                        if (sel.visionObstruction)
                            visibilityStore.deleteFromTriag({
                                target: TriangulationTarget.VISION,
                                shape: sel,
                            });
                        if (sel.movementObstruction)
                            visibilityStore.deleteFromTriag({
                                target: TriangulationTarget.MOVEMENT,
                                shape: sel,
                            });
                        sel.snapToGrid();
                        if (sel.visionObstruction) {
                            visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: sel });
                            visibilityStore.recalculateVision(sel.floor);
                        }
                        if (sel.movementObstruction) {
                            visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: sel });
                            visibilityStore.recalculateMovement(sel.floor);
                        }
                    }

                    if (sel !== this.selectionHelper) {
                        if (sel.visionObstruction) visibilityStore.recalculateVision(sel.floor);
                        if (sel.movementObstruction) visibilityStore.recalculateMovement(sel.floor);
                        if (!sel.preventSync)
                            socket.emit("Shape.Update", { shape: sel.asDict(), redraw: true, temporary: false });
                    }
                    layer.invalidate(false);
                }
                if (this.mode === SelectOperations.Resize) {
                    if (
                        gameSettingsStore.useGrid &&
                        useSnapping(event) &&
                        this.hasFeature(SelectFeatures.Snapping, features)
                    ) {
                        if (sel.visionObstruction)
                            visibilityStore.deleteFromTriag({
                                target: TriangulationTarget.VISION,
                                shape: sel,
                            });
                        if (sel.movementObstruction)
                            visibilityStore.deleteFromTriag({
                                target: TriangulationTarget.MOVEMENT,
                                shape: sel,
                            });
                        sel.resizeToGrid(this.resizePoint, event.ctrlKey);
                        if (sel.visionObstruction) {
                            visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: sel });
                            visibilityStore.recalculateVision(sel.floor);
                        }
                        if (sel.movementObstruction) {
                            visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: sel });
                            visibilityStore.recalculateMovement(sel.floor);
                        }
                    }
                    if (sel !== this.selectionHelper && !sel.preventSync) {
                        socket.emit("Shape.Update", { shape: sel.asDict(), redraw: true, temporary: false });
                    }
                    layer.invalidate(false);
                }
                sel.updatePoints();
            }
        }
        this.mode = SelectOperations.Noop;
        this.active = false;
    }

    onContextMenu(event: MouseEvent, features: ToolFeatures<SelectFeatures>): void {
        if (!this.hasFeature(SelectFeatures.Context, features)) return;
        if (layerManager.getLayer(layerManager.floor!.name) === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = layerManager.getLayer(layerManager.floor!.name)!;
        const mouse = getLocalPointFromEvent(event);
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
        // super call
        (<any>Tool).options.methods.onContextMenu.call(this, event, features);
    }
    updateCursor(layer: Layer, globalMouse: GlobalPoint): void {
        let cursorStyle = "default";
        for (const sel of layer.selection) {
            const resizePoint = sel.getPointIndex(globalMouse, l2gz(3));
            if (resizePoint < 0) continue;
            else {
                let angle = sel.getPointOrientation(resizePoint).angle();
                if (angle < 0) angle += 360;
                const d = 45 / 2;
                if (angle >= 315 + d || angle < d || (angle >= 135 + d && angle < 225 - d)) cursorStyle = "ew-resize";
                if ((angle >= 45 + d && angle < 135 - d) || (angle >= 225 + d && angle < 315 - d))
                    cursorStyle = "ns-resize";
                if ((angle >= d && angle < 90 - d) || (angle >= 180 + d && angle < 270 - d))
                    cursorStyle = "nwse-resize";
                if ((angle >= 90 + d && angle < 180 - d) || (angle >= 270 + d && angle < 360 - d))
                    cursorStyle = "nesw-resize";
            }
        }
        document.body.style.cursor = cursorStyle;
    }
}
</script>
