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
import { getLocalPointFromEvent, useSnapping, equalPoints } from "@/game/utils";
import { visibilityStore } from "@/game/visibility/store";
import { TriangulationTarget } from "@/game/visibility/te/pa";
import { gameSettingsStore } from "../../settings";
import { ToolBasics } from "./ToolBasics";
import { Circle } from "../../shapes/circle";
import { Line } from "../../shapes/line";
import { SyncMode, InvalidationMode } from "../../../core/comm/types";
import { BoundingRect } from "../../shapes/boundingrect";

enum SelectOperations {
    Noop,
    Resize,
    Drag,
    GroupSelect,
    Rotate,
}

export enum SelectFeatures {
    ChangeSelection,
    Context,
    Drag,
    GroupSelect,
    Resize,
    Snapping,
    Rotate,
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
    selectionHelper: Rect | null = null;

    angle = 0;
    rotationUiActive = false;
    rotationAnchor: Line | null = null;
    rotationBox: Rect | null = null;
    rotationEnd: Circle | null = null;

    onToolsModeChange(mode: "Build" | "Play", features: ToolFeatures<SelectFeatures>): void {
        if (mode === "Play") {
            document.body.style.cursor = "default";
            this.removeRotationUi();
        } else {
            if (this.hasFeature(SelectFeatures.Rotate, features)) this.createRotationUi();
        }
    }

    onDown(lp: LocalPoint, event: MouseEvent | TouchEvent, features: ToolFeatures<SelectFeatures>): void {
        const gp = l2g(lp);
        const layer = layerManager.getLayer(layerManager.floor!.name);
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        let hit = false;

        // The selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
        let selectionStack;
        if (!this.hasFeature(SelectFeatures.ChangeSelection, features)) selectionStack = layer.getSelection();
        else if (!layer.getSelection().length) selectionStack = layer.getShapes();
        else selectionStack = layer.getShapes().concat(layer.getSelection());

        for (let i = selectionStack.length - 1; i >= 0; i--) {
            const shape = selectionStack[i];
            if ([this.rotationAnchor?.uuid, this.rotationBox?.uuid, this.rotationEnd?.uuid].includes(shape.uuid))
                continue;
            if (shape.isInvisible && !shape.ownedBy({ movementAccess: true })) continue;

            if (this.hasFeature(SelectFeatures.Rotate, features)) {
                // const anchor = shape.getAnchorLocation();
                // if (equalPoints(anchor.asArray(), lp.asArray(), 5)) {
                //     this.mode = SelectOperations.Rotate;
                //     hit = true;
                //     break;
                // }
            }
            if (this.hasFeature(SelectFeatures.Resize, features)) {
                this.resizePoint = shape.getPointIndex(gp, l2gz(5));
                if (this.resizePoint >= 0) {
                    // Resize case, a corner is selected
                    layer.setSelection(shape);
                    this.originalResizePoints = shape.points;
                    EventBus.$emit("SelectionInfo.Shape.Set", shape);
                    this.mode = SelectOperations.Resize;
                    layer.invalidate(true);
                    hit = true;
                    break;
                }
            }
            if (shape.contains(gp)) {
                if (layer.getSelection().indexOf(shape) === -1) {
                    if (event.ctrlKey) {
                        layer.pushSelection(shape);
                    } else {
                        layer.setSelection(shape);
                    }
                    EventBus.$emit("SelectionInfo.Shape.Set", shape);
                }
                // Drag case, a shape is selected
                if (this.hasFeature(SelectFeatures.Drag, features)) {
                    this.mode = SelectOperations.Drag;
                    const localRefPoint = g2l(shape.refPoint);
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
            for (const selection of layer.getSelection()) EventBus.$emit("SelectionInfo.Shape.Set", selection);

            this.selectionStartPoint = gp;

            if (this.selectionHelper === null) {
                this.selectionHelper = new Rect(this.selectionStartPoint, 0, 0, "rgba(0, 0, 0, 0)", "#7c253e");
                this.selectionHelper.strokeWidth = 2;
                this.selectionHelper.options.set("UiHelper", "true");
                this.selectionHelper.addOwner({ user: gameStore.username, access: { edit: true } }, false);
                layer.addShape(this.selectionHelper, SyncMode.NO_SYNC, InvalidationMode.NO);
            } else {
                this.selectionHelper.refPoint = this.selectionStartPoint;
                this.selectionHelper.w = 0;
                this.selectionHelper.h = 0;
            }

            if (!event.ctrlKey) {
                layer.setSelection();
            }

            if (this.rotationUiActive) {
                this.removeRotationUi();
            }

            layer.invalidate(true);
        }
        if (this.mode !== SelectOperations.Noop) this.active = true;
    }

    onMove(lp: LocalPoint, event: MouseEvent | TouchEvent, features: ToolFeatures<SelectFeatures>): void {
        const gp = l2g(lp);
        // We require move for the resize and rotate cursors
        if (
            !this.active &&
            !(this.hasFeature(SelectFeatures.Resize, features) || this.hasFeature(SelectFeatures.Rotate, features))
        )
            return;

        const layer = layerManager.getLayer(layerManager.floor!.name);
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        if (layer.getSelection().some(s => s.isLocked)) return;

        this.deltaChanged = false;

        if (this.mode === SelectOperations.GroupSelect) {
            // Currently draw on active layer
            const endPoint = gp;

            this.selectionHelper!.w = Math.abs(endPoint.x - this.selectionStartPoint.x);
            this.selectionHelper!.h = Math.abs(endPoint.y - this.selectionStartPoint.y);
            this.selectionHelper!.refPoint = new GlobalPoint(
                Math.min(this.selectionStartPoint.x, endPoint.x),
                Math.min(this.selectionStartPoint.y, endPoint.y),
            );
            layer.invalidate(true);
        } else if (layer.getSelection().length) {
            let delta = Ray.fromPoints(this.dragRay.get(this.dragRay.tMax), lp).direction.multiply(
                1 / gameStore.zoomFactor,
            );
            const ogDelta = delta;
            if (this.mode === SelectOperations.Drag) {
                if (ogDelta.length() === 0) return;
                // If we are on the tokens layer do a movement block check.
                if (layer.name === "tokens" && !(event.shiftKey && gameStore.IS_DM)) {
                    for (const sel of layer.getSelection()) {
                        if (!sel.ownedBy({ movementAccess: true })) continue;
                        delta = calculateDelta(delta, sel, true);
                        if (delta !== ogDelta) this.deltaChanged = true;
                    }
                }
                // Actually apply the delta on all shapes
                for (const sel of layer.getSelection()) {
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
                    if (sel.visionObstruction) visibilityStore.recalculateVision(sel.floor);
                    if (!sel.preventSync)
                        socket.emit("Shape.Update", { shape: sel.asDict(), redraw: true, temporary: true });
                }
                this.dragRay = Ray.fromPoints(this.dragRay.origin, lp);

                if (this.rotationUiActive) {
                    this.updateRotationUi(features);
                }

                layer.invalidate(false);
            } else if (this.mode === SelectOperations.Resize) {
                for (const sel of layer.getSelection()) {
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
                    // todo: think about calling deleteIntersectVertex directly on the corner point
                    if (sel.visionObstruction) {
                        visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: sel });
                        visibilityStore.recalculateVision(sel.floor);
                    }
                    if (!sel.preventSync)
                        socket.emit("Shape.Update", { shape: sel.asDict(), redraw: true, temporary: true });
                    layer.invalidate(false);
                    this.updateCursor(layer, gp);
                }
            } else if (this.mode === SelectOperations.Rotate) {
                for (const sel of layer.getSelection()) {
                    const center = sel.center();
                    sel.angle = -Math.atan2(center.y - gp.y, gp.x - center.x) + Math.PI / 2;
                }
                layer.invalidate(false);
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
        if (layer.getSelection().some(s => s.isLocked)) return;

        if (this.mode === SelectOperations.GroupSelect) {
            if (event.ctrlKey) {
                // If either control or shift are pressed, do not remove selection
            } else {
                layer.clearSelection();
            }
            for (const shape of layer.getShapes()) {
                if (!shape.ownedBy({ movementAccess: true })) continue;
                const bbox = shape.getBoundingBox();
                if (!shape.ownedBy({ movementAccess: true })) continue;
                if (
                    this.selectionHelper!.refPoint.x <= bbox.topRight.x &&
                    this.selectionHelper!.refPoint.x + this.selectionHelper!.w >= bbox.topLeft.x &&
                    this.selectionHelper!.refPoint.y <= bbox.botLeft.y &&
                    this.selectionHelper!.refPoint.y + this.selectionHelper!.h >= bbox.topLeft.y
                ) {
                    if (layer.getSelection().find(it => it === shape) === undefined) {
                        layer.pushSelection(shape);
                    }
                }
            }

            layer.removeShape(this.selectionHelper!, SyncMode.NO_SYNC);
            this.selectionHelper = null;

            if (layer.getSelection().some(s => !s.isLocked))
                layer.setSelection(...layer.getSelection().filter(s => !s.isLocked));

            if (
                layer.getSelection().length > 0 &&
                !this.rotationUiActive &&
                this.hasFeature(SelectFeatures.Rotate, features)
            ) {
                this.createRotationUi();
            }

            layer.invalidate(true);
        } else if (layer.getSelection().length) {
            for (const sel of layer.getSelection()) {
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

                    if (sel.visionObstruction) visibilityStore.recalculateVision(sel.floor);
                    if (sel.movementObstruction) visibilityStore.recalculateMovement(sel.floor);
                    if (!sel.preventSync)
                        socket.emit("Shape.Update", { shape: sel.asDict(), redraw: true, temporary: false });

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
                    if (!sel.preventSync) {
                        socket.emit("Shape.Update", { shape: sel.asDict(), redraw: true, temporary: false });
                    }

                    layer.invalidate(false);
                }
                sel.updatePoints();
            }

            this.updateRotationUi(features);
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
        for (const shape of layer.getSelection()) {
            if (shape.contains(globalMouse)) {
                EventBus.$emit("SelectionInfo.Shape.Set", shape);
                layer.invalidate(true);
                (<ShapeContext>this.$parent.$refs.shapecontext).open(event);
                return;
            }
        }

        // Check if any other shapes are under the mouse
        for (let i = layer.getShapes().length - 1; i >= 0; i--) {
            const shape = layer.getShapes()[i];
            if (shape.contains(globalMouse)) {
                layer.setSelection(shape);
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
        for (const sel of layer.getSelection()) {
            const resizePoint = sel.getPointIndex(globalMouse, l2gz(3));
            if (resizePoint < 0) {
                // test rotate case
                if (this.rotationUiActive) {
                    const anchor = this.rotationAnchor!.endPoint;
                    if (equalPoints(anchor.asArray(), globalMouse.asArray(), 5)) {
                        cursorStyle = "ew-resize";
                        break;
                    }
                }
            } else {
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

    createRotationUi(): void {
        const layer = layerManager.getLayer(layerManager.floor!.name)!;

        if (layer.getSelection().length === 0) return;

        let bbox = layer
            .getSelection()
            .map(s => s.getBoundingBox())
            .reduce((acc: BoundingRect, val: BoundingRect) => acc.union(val));

        if (layer.getSelection().length > 1) bbox = bbox.expand(new Vector(-50, -50));

        const topCenter = new GlobalPoint((bbox.topRight.x + bbox.topLeft.x) / 2, bbox.topLeft.y);
        const topCenterPlus = topCenter.add(new Vector(0, -150));

        this.rotationAnchor = new Line(topCenter, topCenterPlus, l2gz(1.5), "#7c253e");
        this.rotationBox = new Rect(bbox.topLeft, bbox.w, bbox.h, "rgba(0,0,0,0)", "#7c253e");
        this.rotationBox.strokeWidth = 1.5;
        this.rotationEnd = new Circle(topCenterPlus, l2gz(4), "#7c253e", "rgba(0,0,0,0)");

        for (const rotationShape of [this.rotationAnchor, this.rotationBox, this.rotationEnd]) {
            rotationShape.addOwner({ user: gameStore.username, access: { edit: true } }, false);
            layer.addShape(rotationShape, SyncMode.NO_SYNC, InvalidationMode.NO);
        }

        this.rotationUiActive = true;

        layer.invalidate(true);
    }

    removeRotationUi(): void {
        if (this.rotationUiActive) {
            const layer = layerManager.getLayer(layerManager.floor!.name)!;
            layer.removeShape(this.rotationAnchor!, SyncMode.NO_SYNC);
            layer.removeShape(this.rotationBox!, SyncMode.NO_SYNC);
            layer.removeShape(this.rotationEnd!, SyncMode.NO_SYNC);
            this.rotationAnchor = this.rotationBox = this.rotationEnd = null;
            this.rotationUiActive = false;

            layer.invalidate(true);
        }
    }

    updateRotationUi(features: ToolFeatures<SelectFeatures>): void {
        const layer = layerManager.getLayer(layerManager.floor!.name)!;

        if (
            layer.getSelection().length > 0 &&
            !this.rotationUiActive &&
            this.hasFeature(SelectFeatures.Rotate, features)
        ) {
            this.createRotationUi();
        } else if (this.rotationUiActive) {
            let bbox = layer
                .getSelection()
                .map(s => s.getBoundingBox())
                .reduce((acc: BoundingRect, val: BoundingRect) => acc.union(val));

            if (layer.getSelection().length > 1) bbox = bbox.expand(new Vector(-50, -50));

            const topCenter = new GlobalPoint((bbox.topRight.x + bbox.topLeft.x) / 2, bbox.topLeft.y);
            const topCenterPlus = topCenter.add(new Vector(0, -150));

            this.rotationAnchor!.refPoint = topCenter;
            this.rotationAnchor!.endPoint = topCenterPlus;
            this.rotationBox!.refPoint = bbox.topLeft;
            this.rotationBox!.w = bbox.w;
            this.rotationBox!.h = bbox.h;
            this.rotationEnd!.refPoint = topCenterPlus;

            layer.invalidate(true);
        }
    }
}
</script>
