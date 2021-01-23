<script lang="ts">
import Component from "vue-class-component";

import Tool from "@/game/ui/tools/tool.vue";

import { EventBus } from "@/game/event-bus";
import { GlobalPoint, LocalPoint, Ray, Vector } from "@/game/geom";
import { Layer } from "@/game/layers/layer";
import { snapToPoint } from "@/game/layers/utils";
import { Rect } from "@/game/shapes/variants/rect";
import { DEFAULT_GRID_SIZE, gameStore } from "@/game/store";
import { calculateDelta, ToolName, ToolFeatures, ToolPermission } from "@/game/ui/tools/utils";
import { g2l, g2lx, g2ly, l2g, l2gz } from "@/game/units";
import { getLocalPointFromEvent, useSnapping, equalPoints } from "@/game/utils";
import { visibilityStore } from "@/game/visibility/store";
import { TriangulationTarget } from "@/game/visibility/te/pa";
import { gameSettingsStore } from "../../settings";
import { ToolBasics } from "./ToolBasics";
import { Circle } from "../../shapes/variants/circle";
import { Line } from "../../shapes/variants/line";
import { SyncMode, InvalidationMode, SyncTo } from "../../../core/comm/types";
import { BoundingRect } from "../../shapes/variants/boundingrect";
import { floorStore } from "@/game/layers/store";
import { sendShapePositionUpdate, sendShapeSizeUpdate } from "../../api/emits/shape/core";
import { Shape } from "@/game/shapes/shape";
import Tools from "./tools.vue";
import { RulerFeatures } from "./ruler.vue";
import { moveShapes } from "../../operations/movement";
import { Operation } from "../../operations/model";
import { rotateShapes } from "../../operations/rotation";
import { addOperation } from "../../operations/undo";

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

const ANGLE_SNAP = (45 * Math.PI) / 180; // Calculate 45 degrees in radians just once

const rulerPermission = [{ name: ToolName.Ruler, features: { enabled: [RulerFeatures.All] }, early: true }];

@Component
export default class SelectTool extends Tool implements ToolBasics {
    $parent!: Tools;

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
    selectionHelper: Rect | undefined = undefined;

    angle = 0;
    rotationUiActive = false;
    rotationAnchor: Line | undefined = undefined;
    rotationBox: Rect | undefined = undefined;
    rotationEnd: Circle | undefined = undefined;

    snappedToPoint = false;

    hasSelection = false;
    showRuler = false;

    operationReady = false;
    operationList: Operation | undefined = undefined;

    permittedTools_: ToolPermission[] = [];

    get permittedTools(): ToolPermission[] {
        return this.permittedTools_;
    }

    toggleShowRuler(event: MouseEvent): void {
        const button = event.target as HTMLButtonElement;
        const state = button.getAttribute("aria-pressed") ?? "false";
        this.showRuler = state === "false";
        this.setToolPermissions();
    }

    setToolPermissions(permissions?: ToolPermission[]): void {
        const hasRuler = this.permittedTools_.length > 0;
        if (permissions) {
            this.permittedTools_ = permissions;
        } else if (this.showRuler) {
            this.permittedTools_ = rulerPermission;
        } else {
            this.permittedTools_ = [];
        }
        if (this.permittedTools_.length === 0 && hasRuler) {
            this.$parent.componentMap["Ruler"].onDeselect();
        }
    }

    // Life cycle

    mounted(): void {
        EventBus.$on("SelectionInfo.Shapes.Set", (shapes: Shape[]) => {
            this.removeRotationUi();
            // We don't have feature information, might want to store this as a property instead ?
            if (this.$parent.mode === "Build" && shapes.length > 0) this.createRotationUi({});
        });
        EventBus.$on("Select.RotationHelper.Reset", () => {
            this.removeRotationUi();
            // We don't have feature information, might want to store this as a property instead ?
            if (this.$parent.mode === "Build") this.createRotationUi({});
        });
        this.setToolPermissions();
    }

    beforeDestroy(): void {
        EventBus.$off("SelectionInfo.Shapes.Set");
        EventBus.$off("Select.RotationHelper.Reset");
    }

    onToolsModeChange(mode: "Build" | "Play", features: ToolFeatures<SelectFeatures>): void {
        if (mode === "Play") {
            document.body.style.cursor = "default";
            this.removeRotationUi();
        } else {
            if (this.hasFeature(SelectFeatures.Rotate, features)) this.createRotationUi(features);
        }
        this.$forceUpdate();
    }

    onDown(lp: LocalPoint, event: MouseEvent | TouchEvent, features: ToolFeatures<SelectFeatures>): void {
        // if we only have context capabilities, immediately skip
        if (features.enabled?.length === 1 && features.enabled[0] === SelectFeatures.Context) return;

        const gp = l2g(lp);
        const layer = floorStore.currentLayer;
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        this.operationReady = false;
        this.operationList = undefined;

        let hit = false;

        // The selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
        const layerSelection = layer.getSelection({ includeComposites: false });
        let selectionStack: readonly Shape[];
        if (this.hasFeature(SelectFeatures.ChangeSelection, features)) {
            const shapes = layer.getShapes({ includeComposites: false });
            if (!layerSelection.length) selectionStack = shapes;
            else selectionStack = shapes.concat(layerSelection);
        } else {
            selectionStack = layerSelection;
        }

        for (let i = selectionStack.length - 1; i >= 0; i--) {
            const shape = selectionStack[i];
            if (!shape.options.has("preFogShape") && (shape.options.get("skipDraw") ?? false)) continue;
            if ([this.rotationAnchor?.uuid, this.rotationBox?.uuid, this.rotationEnd?.uuid].includes(shape.uuid))
                continue;
            if (shape.isInvisible && !shape.ownedBy(false, { movementAccess: true })) continue;

            if (this.rotationUiActive && this.hasFeature(SelectFeatures.Rotate, features)) {
                const anchor = this.rotationAnchor!.points[1];
                if (equalPoints(anchor, gp.asArray(), 10)) {
                    this.setToolPermissions([]);
                    this.mode = SelectOperations.Rotate;
                    hit = true;

                    this.operationList = { type: "rotation", center: new GlobalPoint(0, 0), shapes: [] };
                    for (const shape of layer.getSelection({ includeComposites: false }))
                        this.operationList.shapes.push({ uuid: shape.uuid, from: shape.angle, to: 0 });

                    break;
                }
            }
            if (this.hasFeature(SelectFeatures.Resize, features)) {
                this.resizePoint = shape.getPointIndex(gp, l2gz(5));
                if (this.resizePoint >= 0) {
                    this.setToolPermissions([]);
                    // Resize case, a corner is selected
                    layer.setSelection(shape);
                    this.removeRotationUi();
                    this.createRotationUi(features);
                    this.originalResizePoints = shape.points;
                    this.mode = SelectOperations.Resize;
                    layer.invalidate(true);
                    hit = true;
                    break;
                }
            }
            if (shape.contains(gp)) {
                if (layerSelection.indexOf(shape) === -1) {
                    if (event.ctrlKey) {
                        layer.pushSelection(shape);
                    } else {
                        layer.setSelection(shape);
                    }
                    this.removeRotationUi();
                    this.createRotationUi(features);
                }
                // Drag case, a shape is selected
                if (this.hasFeature(SelectFeatures.Drag, features)) {
                    this.mode = SelectOperations.Drag;
                    const localRefPoint = g2l(shape.refPoint);
                    this.dragRay = Ray.fromPoints(localRefPoint, lp);

                    // don't use layerSelection here as it can be outdated by the pushSelection setSelection above
                    this.operationList = { type: "movement", shapes: [] };
                    for (const shape of layer.getSelection({ includeComposites: false }))
                        this.operationList.shapes.push({ uuid: shape.uuid, from: shape.refPoint.asArray(), to: [] });
                }
                layer.invalidate(true);
                hit = true;
                break;
            }
        }

        // GroupSelect case, draw a selection box to select multiple shapes
        if (!hit) {
            this.setToolPermissions([]);
            if (!this.hasFeature(SelectFeatures.ChangeSelection, features)) return;
            if (!this.hasFeature(SelectFeatures.GroupSelect, features)) return;
            this.mode = SelectOperations.GroupSelect;

            this.selectionStartPoint = gp;

            if (this.selectionHelper === undefined) {
                this.selectionHelper = new Rect(this.selectionStartPoint, 0, 0, {
                    fillColour: "rgba(0, 0, 0, 0)",
                    strokeColour: "#7c253e",
                });
                this.selectionHelper.strokeWidth = 2;
                this.selectionHelper.options.set("UiHelper", "true");
                this.selectionHelper.addOwner({ user: gameStore.username, access: { edit: true } }, SyncTo.SHAPE);
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
        // if we only have context capabilities, immediately skip
        if (features.enabled?.length === 1 && features.enabled[0] === SelectFeatures.Context) return;

        const gp = l2g(lp);
        // We require move for the resize and rotate cursors
        if (
            !this.active &&
            !(this.hasFeature(SelectFeatures.Resize, features) || this.hasFeature(SelectFeatures.Rotate, features))
        )
            return;

        const layer = floorStore.currentLayer;
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        const layerSelection = layer.getSelection({ includeComposites: false });
        if (layerSelection.some((s) => s.isLocked)) return;

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
        } else if (layerSelection.length) {
            let delta = Ray.fromPoints(this.dragRay.get(this.dragRay.tMax), lp).direction.multiply(
                1 / gameStore.zoomFactor,
            );
            const ogDelta = delta;
            if (this.mode === SelectOperations.Drag) {
                if (ogDelta.length() === 0) return;
                // If we are on the tokens layer do a movement block check.
                if (layer.name === "tokens" && !(event.shiftKey && gameStore.IS_DM)) {
                    for (const sel of layerSelection) {
                        if (!sel.ownedBy(false, { movementAccess: true })) continue;
                        delta = calculateDelta(delta, sel, true);
                        if (delta !== ogDelta) this.deltaChanged = true;
                    }
                }

                moveShapes(layerSelection, delta, true);

                this.dragRay = Ray.fromPoints(this.dragRay.origin, lp);

                if (this.rotationUiActive) {
                    this.removeRotationUi();
                    this.createRotationUi(features);
                }

                layer.invalidate(false);
            } else if (this.mode === SelectOperations.Resize) {
                let recalc = false;
                for (const sel of layerSelection) {
                    if (!sel.ownedBy(false, { movementAccess: true })) continue;
                    if (sel.visionObstruction)
                        visibilityStore.deleteFromTriag({
                            target: TriangulationTarget.VISION,
                            shape: sel.uuid,
                        });
                    let ignorePoint: GlobalPoint | undefined;
                    if (this.resizePoint >= 0)
                        ignorePoint = GlobalPoint.fromArray(this.originalResizePoints[this.resizePoint]);
                    let targetPoint = gp;
                    if (useSnapping(event) && this.hasFeature(SelectFeatures.Snapping, features))
                        [targetPoint, this.snappedToPoint] = snapToPoint(floorStore.currentLayer!, gp, ignorePoint);
                    else this.snappedToPoint = false;
                    this.resizePoint = sel.resize(this.resizePoint, targetPoint, event.ctrlKey);
                    // todo: think about calling deleteIntersectVertex directly on the corner point
                    if (sel.visionObstruction) {
                        visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: sel.uuid });
                        recalc = true;
                    }
                    if (!sel.preventSync) sendShapeSizeUpdate({ shape: sel, temporary: true });
                }
                if (recalc) visibilityStore.recalculateVision(layerSelection[0].floor.id);
                layer.invalidate(false);
                this.updateCursor(layer, gp);
            } else if (this.mode === SelectOperations.Rotate) {
                const center = this.rotationBox!.center();
                const newAngle = -Math.atan2(center.y - gp.y, gp.x - center.x) + Math.PI / 2;
                this.rotateSelection(newAngle, center, true);
            } else {
                this.updateCursor(layer, gp);
            }
        } else {
            document.body.style.cursor = "default";
        }
    }

    onUp(lp: LocalPoint, event: MouseEvent | TouchEvent, features: ToolFeatures<SelectFeatures>): void {
        // if we only have context capabilities, immediately skip
        if (features.enabled?.length === 1 && features.enabled[0] === SelectFeatures.Context) {
            // When using pan during select, the dragray will use a wrong lp to to the drag calculation in move
            // Maybe consider using a gp for the ray instead to avoid this in the future ?
            this.dragRay = Ray.fromPoints(this.dragRay.origin, lp);
            return;
        }

        if (!this.active) return;
        this.active = false;

        if (floorStore.currentLayer === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = floorStore.currentLayer!;

        let layerSelection = layer.getSelection({ includeComposites: false });

        if (layerSelection.some((s) => s.isLocked)) return;

        if (this.mode === SelectOperations.GroupSelect) {
            if (event.ctrlKey) {
                // If either control or shift are pressed, do not remove selection
            } else {
                layer.clearSelection();
            }
            const cbbox = this.selectionHelper!.getBoundingBox();
            for (const shape of layer.getShapes({ includeComposites: false })) {
                if (!shape.options.has("preFogShape") && (shape.options.get("skipDraw") ?? false)) continue;
                if (!shape.ownedBy(false, { movementAccess: true })) continue;
                if (!shape.visibleInCanvas(layer.canvas, { includeAuras: false })) continue;
                if (layerSelection.some((s) => s.uuid === shape.uuid)) continue;

                if (shape.points.length > 1) {
                    for (let i = 0; i < shape.points.length; i++) {
                        const ray = Ray.fromPoints(
                            GlobalPoint.fromArray(shape.points[i]),
                            GlobalPoint.fromArray(shape.points[(i + 1) % shape.points.length]),
                        );
                        if (cbbox.containsRay(ray).hit) {
                            layer.pushSelection(shape);
                            i = shape.points.length; // break out of the inner loop
                        }
                    }
                } else {
                    if (cbbox.contains(GlobalPoint.fromArray(shape.points[0]))) {
                        layer.pushSelection(shape);
                    }
                }
            }

            layerSelection = layer.getSelection({ includeComposites: false });

            layer.removeShape(this.selectionHelper!, SyncMode.NO_SYNC, true);
            this.selectionHelper = undefined;

            if (layerSelection.some((s) => !s.isLocked))
                layer.setSelection(...layerSelection.filter((s) => !s.isLocked));

            if (
                layerSelection.length > 0 &&
                !this.rotationUiActive &&
                this.hasFeature(SelectFeatures.Rotate, features)
            ) {
                this.createRotationUi(features);
            }

            layer.invalidate(true);
        } else if (layerSelection.length) {
            let recalcVision = false;
            let recalcMovement = false;

            if (this.mode === SelectOperations.Drag) {
                const updateList = [];
                for (const [s, sel] of layerSelection.entries()) {
                    if (!sel.ownedBy(false, { movementAccess: true })) continue;

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
                                shape: sel.uuid,
                            });
                        if (sel.movementObstruction)
                            visibilityStore.deleteFromTriag({
                                target: TriangulationTarget.MOVEMENT,
                                shape: sel.uuid,
                            });

                        sel.snapToGrid();

                        if (sel.visionObstruction) {
                            visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: sel.uuid });
                            recalcVision = true;
                        }
                        if (sel.movementObstruction) {
                            visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: sel.uuid });
                            recalcMovement = true;
                        }
                    }
                    this.operationList!.shapes[s].to = sel.refPoint.asArray();
                    this.operationReady = true;

                    if (sel.visionObstruction) recalcVision = true;
                    if (sel.movementObstruction) recalcMovement = true;
                    if (!sel.preventSync) updateList.push(sel);
                    sel.updatePoints();
                }
                sendShapePositionUpdate(updateList, false);
            }
            if (this.mode === SelectOperations.Resize) {
                for (const sel of layerSelection) {
                    if (!sel.ownedBy(false, { movementAccess: true })) continue;
                    if (
                        gameSettingsStore.useGrid &&
                        useSnapping(event) &&
                        this.hasFeature(SelectFeatures.Snapping, features)
                    ) {
                        if (sel.visionObstruction)
                            visibilityStore.deleteFromTriag({
                                target: TriangulationTarget.VISION,
                                shape: sel.uuid,
                            });
                        if (sel.movementObstruction)
                            visibilityStore.deleteFromTriag({
                                target: TriangulationTarget.MOVEMENT,
                                shape: sel.uuid,
                            });
                        sel.resizeToGrid(this.resizePoint, event.ctrlKey);
                        if (sel.visionObstruction) {
                            visibilityStore.addToTriag({ target: TriangulationTarget.VISION, shape: sel.uuid });
                            recalcVision = true;
                        }
                        if (sel.movementObstruction) {
                            visibilityStore.addToTriag({ target: TriangulationTarget.MOVEMENT, shape: sel.uuid });
                            recalcMovement = true;
                        }
                    }
                    if (!sel.preventSync) {
                        sendShapeSizeUpdate({ shape: sel, temporary: false });
                    }
                    sel.updatePoints();
                }
            }
            if (this.mode === SelectOperations.Rotate) {
                const rotationCenter = this.rotationBox!.center();

                for (const [s, sel] of layerSelection.entries()) {
                    if (!sel.ownedBy(false, { movementAccess: true })) continue;

                    const newAngle = Math.round(this.angle / ANGLE_SNAP) * ANGLE_SNAP;
                    if (
                        newAngle !== this.angle &&
                        useSnapping(event) &&
                        this.hasFeature(SelectFeatures.Snapping, features)
                    ) {
                        this.rotateSelection(newAngle, rotationCenter, false);
                    } else if (!sel.preventSync) sendShapePositionUpdate([sel], false);

                    this.operationList!.shapes[s].to = sel.angle;
                    this.operationReady = true;

                    sel.updatePoints();
                }

                if (this.operationList?.type === "rotation") {
                    this.operationList.center = rotationCenter;
                }
            }

            if (recalcVision) visibilityStore.recalculateVision(layerSelection[0].floor.id);
            if (recalcMovement) visibilityStore.recalculateMovement(layerSelection[0].floor.id);
            layer.invalidate(false);

            if (this.mode !== SelectOperations.Rotate) {
                this.removeRotationUi();
                this.createRotationUi(features);
            }
        }

        if (this.operationReady) addOperation(this.operationList!);

        this.hasSelection = layerSelection.length > 0;
        this.setToolPermissions();

        this.mode = SelectOperations.Noop;
    }

    onContextMenu(event: MouseEvent, features: ToolFeatures<SelectFeatures>): void {
        if (!this.hasFeature(SelectFeatures.Context, features)) return;
        if (floorStore.currentLayer === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = floorStore.currentLayer!;
        const layerSelection = layer.getSelection({ includeComposites: false });
        const mouse = getLocalPointFromEvent(event);
        const globalMouse = l2g(mouse);
        for (const shape of layerSelection) {
            if (shape.contains(globalMouse)) {
                layer.invalidate(true);
                this.$parent.$refs.shapecontext.open(event);
                return;
            }
        }

        // Check if any other shapes are under the mouse
        for (let i = layer.size({ includeComposites: false }) - 1; i >= 0; i--) {
            const shape = layer.getShapes({ includeComposites: false })[i];
            if (shape.contains(globalMouse)) {
                layer.setSelection(shape);
                layer.invalidate(true);
                this.$parent.$refs.shapecontext.open(event);
                return;
            }
        }
        // Fallback to default context menu
        this.$parent.$refs.defaultcontext.open(event);
    }

    onKeyUp(event: KeyboardEvent): void {
        if (event.defaultPrevented) return;
        if (event.key === " " && this.active) {
            event.preventDefault();
        }
        this.defaultKeyUp(event);
    }

    updateCursor(layer: Layer, globalMouse: GlobalPoint): void {
        let cursorStyle = "default";
        const layerSelection = layer.getSelection({ includeComposites: false });
        for (const sel of layerSelection) {
            const resizePoint = sel.getPointIndex(globalMouse, l2gz(3));
            if (resizePoint < 0) {
                // test rotate case
                if (this.rotationUiActive) {
                    const anchor = this.rotationAnchor!.points[1];
                    if (equalPoints(anchor, globalMouse.asArray(), 10)) {
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

    createRotationUi(features: ToolFeatures<SelectFeatures>): void {
        const layer = floorStore.currentLayer!;

        const layerSelection = layer.getSelection({ includeComposites: false });

        if (layerSelection.length === 0 || this.rotationUiActive || !this.hasFeature(SelectFeatures.Rotate, features))
            return;

        let bbox: BoundingRect;
        if (layerSelection.length === 1) {
            bbox = layerSelection[0].getBoundingBox();
        } else {
            bbox = layerSelection
                .map((s) => s.getAABB())
                .reduce((acc: BoundingRect, val: BoundingRect) => acc.union(val))
                .expand(new Vector(-50, -50));
        }

        const topCenter = new GlobalPoint((bbox.topRight.x + bbox.topLeft.x) / 2, bbox.topLeft.y);
        const topCenterPlus = topCenter.add(new Vector(0, -DEFAULT_GRID_SIZE));

        this.angle = 0;
        this.rotationAnchor = new Line(topCenter, topCenterPlus, { lineWidth: l2gz(1.5), strokeColour: "#7c253e" });
        this.rotationBox = new Rect(bbox.topLeft, bbox.w, bbox.h, {
            fillColour: "rgba(0,0,0,0)",
            strokeColour: "#7c253e",
        });
        this.rotationBox.strokeWidth = 1.5;
        this.rotationEnd = new Circle(topCenterPlus, l2gz(4), { fillColour: "#7c253e", strokeColour: "rgba(0,0,0,0)" });

        for (const rotationShape of [this.rotationAnchor, this.rotationBox, this.rotationEnd]) {
            rotationShape.addOwner({ user: gameStore.username, access: { edit: true } }, SyncTo.SHAPE);
            layer.addShape(rotationShape, SyncMode.NO_SYNC, InvalidationMode.NO);
        }

        if (layerSelection.length === 1) {
            const angle = layerSelection[0].angle;
            this.angle = angle;
            this.rotationBox.angle = angle;
            this.rotationAnchor.rotateAround(bbox.center(), angle);
            this.rotationEnd.rotateAround(bbox.center(), angle);
        }

        this.rotationUiActive = true;
        layer.invalidate(true);
    }

    removeRotationUi(): void {
        if (this.rotationUiActive) {
            const layer = this.rotationAnchor!.layer;
            layer.removeShape(this.rotationAnchor!, SyncMode.NO_SYNC, true);
            layer.removeShape(this.rotationBox!, SyncMode.NO_SYNC, true);
            layer.removeShape(this.rotationEnd!, SyncMode.NO_SYNC, true);
            this.rotationAnchor = this.rotationBox = this.rotationEnd = undefined;
            this.rotationUiActive = false;

            layer.invalidate(true);
        }
    }

    rotateSelection(newAngle: number, center: GlobalPoint, temporary: boolean): void {
        const layer = floorStore.currentLayer!;
        const dA = newAngle - this.angle;
        this.angle = newAngle;
        const layerSelection = layer.getSelection({ includeComposites: false });

        rotateShapes(layerSelection, dA, center, temporary);

        this.rotationEnd!.rotateAround(center, dA);
        this.rotationAnchor!.rotateAround(center, dA);
        this.rotationBox!.angle = this.angle;
        layer.invalidate(false);
    }
}
</script>

<template>
    <div
        id="ruler"
        class="tool-detail"
        v-if="selected && hasSelection"
        :style="{ '--detailRight': detailRight(), '--detailArrow': detailArrow }"
    >
        <button @click="toggleShowRuler" :aria-pressed="showRuler">Show ruler</button>
    </div>
</template>

<style scoped lang="scss">
#ruler {
    display: flex;
}

button {
    display: block;
    box-sizing: border-box;
    border: none;
    color: inherit;
    background: none;
    font: inherit;
    line-height: inherit;
    text-align: left;
    padding: 0.4em 0 0.4em 4em;
    position: relative;
    outline: none;

    &:hover {
        &::before {
            box-shadow: 0 0 0.5em #333;
        }

        &::after {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='rgba(0,0,0,.25)'/%3E%3C/svg%3E");
            background-size: 30%;
            background-repeat: no-repeat;
            background-position: center center;
        }
    }

    &::before,
    &::after {
        content: "";
        position: absolute;
        height: 1.1em;
        transition: all 0.25s ease;
    }

    &::before {
        left: 0;
        top: 0.4em;
        width: 2.6em;
        border: 0.2em solid #767676;
        background: #767676;
        border-radius: 1.1em;
    }

    &::after {
        left: 0;
        top: 0.45em;
        background-color: #fff;
        background-position: center center;
        border-radius: 50%;
        width: 1.1em;
        border: 0.15em solid #767676;
    }

    &[aria-pressed="true"] {
        &::after {
            left: 1.6em;
            border-color: #36a829;
            color: #36a829;
        }

        &::before {
            background-color: #36a829;
            border-color: #36a829;
        }
    }
}
</style>
