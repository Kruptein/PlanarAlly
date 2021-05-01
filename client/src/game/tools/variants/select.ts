import { ref } from "vue";

import { g2l, g2lx, g2ly, l2g, l2gz } from "../../../core/conversions";
import { addP, GlobalPoint, LocalPoint, Ray, toArrayP, toGP, toLP, Vector } from "../../../core/geometry";
import { equalPoints, snapToPoint } from "../../../core/math";
import { InvalidationMode, SyncMode, SyncTo } from "../../../core/models/types";
import { ctrlOrCmdPressed } from "../../../core/utils";
import { i18n } from "../../../i18n";
import { clientStore, DEFAULT_GRID_SIZE } from "../../../store/client";
import { floorStore } from "../../../store/floor";
import { gameStore } from "../../../store/game";
import { settingsStore } from "../../../store/settings";
import { sendShapePositionUpdate, sendShapeSizeUpdate } from "../../api/emits/shape/core";
import { calculateDelta } from "../../drag";
import { getLocalPointFromEvent } from "../../input/mouse";
import { selectionState } from "../../layers/selection";
import { ISelectTool, ToolFeatures, ToolMode, ToolName, ToolPermission } from "../../models/tools";
import { Operation } from "../../operations/model";
import { moveShapes } from "../../operations/movement";
import { resizeShape } from "../../operations/resize";
import { rotateShapes } from "../../operations/rotation";
import { addOperation } from "../../operations/undo";
import { Shape } from "../../shapes/shape";
import { BoundingRect } from "../../shapes/variants/boundingRect";
import { Circle } from "../../shapes/variants/circle";
import { Line } from "../../shapes/variants/line";
import { Rect } from "../../shapes/variants/rect";
import { openDefaultContextMenu, openShapeContextMenu } from "../../ui/contextmenu/state";
import { TriangulationTarget, visionState } from "../../vision/state";
import { Tool } from "../tool";
import { activeToolMode, deactivateTool } from "../tools";

import { RulerFeatures } from "./ruler";

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

// Calculate 45 degrees in radians just once
const ANGLE_SNAP = (45 * Math.PI) / 180;

const rulerPermission = [{ name: ToolName.Ruler, features: { enabled: [RulerFeatures.All] }, early: true }];

class SelectTool extends Tool implements ISelectTool {
    readonly toolName = ToolName.Select;
    readonly toolTranslation = i18n.global.t("tool.Select");

    // REACTIVE PROPERTIES
    hasSelection = ref(false);
    showRuler = ref(false);

    // NON REACTIVE PROPERTIES

    mode = SelectOperations.Noop;

    angle = 0;
    rotationUiActive = false;
    rotationAnchor?: Line;
    rotationBox?: Rect;
    rotationEnd?: Circle;

    resizePoint = 0;
    originalResizePoints: [number, number][] = [];

    deltaChanged = false;
    snappedToPoint = false;

    // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
    // we keep track of the actual offset within the asset.
    dragRay = new Ray<LocalPoint>(toLP(0, 0), new Vector(0, 0));
    selectionStartPoint = toGP(-1000, -1000);
    selectionHelper: Rect | undefined = undefined;

    operationReady = false;
    operationList?: Operation;

    private permittedTools_: ToolPermission[] = [];

    get permittedTools(): ToolPermission[] {
        return this.permittedTools_;
    }

    setToolPermissions(permissions?: ToolPermission[]): void {
        const hasRuler = this.permittedTools_.length > 0;
        if (permissions) {
            this.permittedTools_ = permissions;
        } else if (this.showRuler.value) {
            this.permittedTools_ = rulerPermission;
        } else {
            this.permittedTools_ = [];
        }
        if (this.permittedTools_.length === 0 && hasRuler) {
            deactivateTool(ToolName.Ruler);
        }
    }

    onToolsModeChange(mode: ToolMode, features: ToolFeatures<SelectFeatures>): void {
        if (mode === ToolMode.Play) {
            document.body.style.cursor = "default";
            this.removeRotationUi();
        } else if (this.hasFeature(SelectFeatures.Rotate, features)) {
            this.createRotationUi(features);
        }
    }

    // INPUT HANDLERS

    // eslint-disable-next-line @typescript-eslint/require-await
    async onDown(
        lp: LocalPoint,
        event: MouseEvent | TouchEvent,
        features: ToolFeatures<SelectFeatures>,
    ): Promise<void> {
        // if we only have context capabilities, immediately skip
        if (features.enabled?.length === 1 && features.enabled[0] === SelectFeatures.Context) return;

        const gp = l2g(lp);
        const layer = floorStore.currentLayer.value;
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        this.operationReady = false;
        this.operationList = undefined;

        let hit = false;

        // The selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
        const layerSelection = selectionState.get({ includeComposites: false });
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
            if (!shape.options.has("preFogShape") && ((shape.options.get("skipDraw") as boolean | undefined) ?? false))
                continue;
            if ([this.rotationAnchor?.uuid, this.rotationBox?.uuid, this.rotationEnd?.uuid].includes(shape.uuid))
                continue;
            if (shape.isInvisible && !shape.ownedBy(false, { movementAccess: true })) continue;

            if (this.rotationUiActive && this.hasFeature(SelectFeatures.Rotate, features)) {
                const anchor = this.rotationAnchor!.points[1];
                if (equalPoints(anchor, toArrayP(gp), 10)) {
                    this.setToolPermissions([]);
                    this.mode = SelectOperations.Rotate;
                    hit = true;

                    this.operationList = { type: "rotation", center: toGP(0, 0), shapes: [] };
                    for (const shape of selectionState.get({ includeComposites: false }))
                        this.operationList.shapes.push({ uuid: shape.uuid, from: shape.angle, to: 0 });

                    break;
                }
            }
            if (this.hasFeature(SelectFeatures.Resize, features)) {
                this.resizePoint = shape.getPointIndex(gp, l2gz(5));
                if (this.resizePoint >= 0) {
                    this.setToolPermissions([]);
                    // Resize case, a corner is selected
                    selectionState.set(shape);
                    this.removeRotationUi();
                    this.createRotationUi(features);
                    this.originalResizePoints = shape.points;
                    this.mode = SelectOperations.Resize;
                    layer.invalidate(true);
                    hit = true;

                    this.operationList = {
                        type: "resize",
                        uuid: shape.uuid,
                        fromPoint: shape.points[this.resizePoint],
                        toPoint: shape.points[this.resizePoint],
                        resizePoint: this.resizePoint,
                        retainAspectRatio: false,
                    };

                    break;
                }
            }
            if (shape.contains(gp)) {
                if (layerSelection.indexOf(shape) === -1) {
                    if (ctrlOrCmdPressed(event)) {
                        selectionState.push(shape);
                    } else {
                        selectionState.set(shape);
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
                    for (const shape of selectionState.get({ includeComposites: false }))
                        this.operationList.shapes.push({
                            uuid: shape.uuid,
                            from: toArrayP(shape.refPoint),
                            to: toArrayP(shape.refPoint),
                        });
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
                this.selectionHelper.addOwner(
                    { user: clientStore.state.username, access: { edit: true } },
                    SyncTo.SHAPE,
                );
                layer.addShape(this.selectionHelper, SyncMode.NO_SYNC, InvalidationMode.NO);
            } else {
                this.selectionHelper.refPoint = this.selectionStartPoint;
                this.selectionHelper.w = 0;
                this.selectionHelper.h = 0;
            }

            if (!ctrlOrCmdPressed(event)) {
                selectionState.clear(false);
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

        // We require move for the resize and rotate cursors
        if (
            !this.active &&
            !(this.hasFeature(SelectFeatures.Resize, features) || this.hasFeature(SelectFeatures.Rotate, features))
        )
            return;

        const layer = floorStore.currentLayer.value;
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        const layerSelection = selectionState.get({ includeComposites: false });
        if (layerSelection.some((s) => s.isLocked)) return;

        const gp = l2g(lp);

        this.deltaChanged = false;

        if (this.mode === SelectOperations.GroupSelect) {
            // Currently draw on active layer
            const endPoint = gp;

            this.selectionHelper!.w = Math.abs(endPoint.x - this.selectionStartPoint.x);
            this.selectionHelper!.h = Math.abs(endPoint.y - this.selectionStartPoint.y);
            this.selectionHelper!.refPoint = toGP(
                Math.min(this.selectionStartPoint.x, endPoint.x),
                Math.min(this.selectionStartPoint.y, endPoint.y),
            );
            layer.invalidate(true);
        } else if (layerSelection.length) {
            let delta = Ray.fromPoints(this.dragRay.get(this.dragRay.tMax), lp).direction.multiply(
                1 / clientStore.zoomFactor.value,
            );
            const ogDelta = delta;
            if (this.mode === SelectOperations.Drag) {
                if (ogDelta.length() === 0) return;
                // If we are on the tokens layer do a movement block check.
                if (layer.name === "tokens" && !(event.shiftKey && gameStore.state.isDm)) {
                    for (const sel of layerSelection) {
                        if (!sel.ownedBy(false, { movementAccess: true })) continue;
                        delta = calculateDelta(delta, sel, true);
                        if (delta !== ogDelta) this.deltaChanged = true;
                    }
                }

                moveShapes(layerSelection, delta, true);

                if (!this.deltaChanged) {
                    this.dragRay = Ray.fromPoints(this.dragRay.origin, lp);
                }

                if (this.rotationUiActive) {
                    this.removeRotationUi();
                    this.createRotationUi(features);
                }

                layer.invalidate(false);
            } else if (this.mode === SelectOperations.Resize) {
                const shape = layerSelection[0];

                if (!shape.ownedBy(false, { movementAccess: true })) return;

                let ignorePoint: GlobalPoint | undefined;
                if (this.resizePoint >= 0) ignorePoint = toGP(this.originalResizePoints[this.resizePoint]);
                let targetPoint = gp;
                if (clientStore.useSnapping(event) && this.hasFeature(SelectFeatures.Snapping, features))
                    [targetPoint, this.snappedToPoint] = snapToPoint(floorStore.currentLayer.value!, gp, ignorePoint);
                else this.snappedToPoint = false;

                this.resizePoint = resizeShape(shape, targetPoint, this.resizePoint, ctrlOrCmdPressed(event), true);
                this.updateCursor(gp);
            } else if (this.mode === SelectOperations.Rotate) {
                const center = this.rotationBox!.center();
                const newAngle = -Math.atan2(center.y - gp.y, gp.x - center.x) + Math.PI / 2;
                this.rotateSelection(newAngle, center, true);
            } else {
                this.updateCursor(gp);
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
        const layer = floorStore.currentLayer.value!;

        let layerSelection = selectionState.get({ includeComposites: false });

        if (layerSelection.some((s) => s.isLocked)) return;

        if (this.mode === SelectOperations.GroupSelect) {
            if (ctrlOrCmdPressed(event)) {
                // If either control or shift are pressed, do not remove selection
            } else {
                selectionState.clear(false);
            }
            const cbbox = this.selectionHelper!.getBoundingBox();
            for (const shape of layer.getShapes({ includeComposites: false })) {
                if (
                    !shape.options.has("preFogShape") &&
                    ((shape.options.get("skipDraw") as boolean | undefined) ?? false)
                )
                    continue;
                if (!shape.ownedBy(false, { movementAccess: true })) continue;
                if (!shape.visibleInCanvas(layer.canvas, { includeAuras: false })) continue;
                if (layerSelection.some((s) => s.uuid === shape.uuid)) continue;

                if (shape.points.length > 1) {
                    for (let i = 0; i < shape.points.length; i++) {
                        const ray = Ray.fromPoints(
                            toGP(shape.points[i]),
                            toGP(shape.points[(i + 1) % shape.points.length]),
                        );
                        if (cbbox.containsRay(ray).hit) {
                            selectionState.push(shape);
                            i = shape.points.length; // break out of the inner loop
                        }
                    }
                } else {
                    if (cbbox.contains(toGP(shape.points[0]))) {
                        selectionState.push(shape);
                    }
                }
            }

            layerSelection = selectionState.get({ includeComposites: false });

            layer.removeShape(this.selectionHelper!, SyncMode.NO_SYNC, true);
            this.selectionHelper = undefined;

            if (layerSelection.some((s) => !s.isLocked)) {
                selectionState.set(...layerSelection.filter((s) => !s.isLocked));
            }

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
                        settingsStore.useGrid.value &&
                        clientStore.useSnapping(event) &&
                        this.hasFeature(SelectFeatures.Snapping, features) &&
                        !this.deltaChanged
                    ) {
                        if (sel.blocksVision)
                            visionState.deleteFromTriangulation({
                                target: TriangulationTarget.VISION,
                                shape: sel.uuid,
                            });
                        if (sel.blocksMovement)
                            visionState.deleteFromTriangulation({
                                target: TriangulationTarget.MOVEMENT,
                                shape: sel.uuid,
                            });

                        sel.snapToGrid();

                        if (sel.blocksVision) {
                            visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: sel.uuid });
                            recalcVision = true;
                        }
                        if (sel.blocksMovement) {
                            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: sel.uuid });
                            recalcMovement = true;
                        }
                    }
                    if (this.operationList?.type === "movement") {
                        this.operationList.shapes[s].to = toArrayP(sel.refPoint);
                        this.operationReady = true;
                    }

                    if (sel.blocksVision) recalcVision = true;
                    if (sel.blocksMovement) recalcMovement = true;
                    if (!sel.preventSync) updateList.push(sel);
                    sel.updatePoints();
                }
                sendShapePositionUpdate(updateList, false);
            }
            if (this.mode === SelectOperations.Resize) {
                for (const sel of layerSelection) {
                    if (!sel.ownedBy(false, { movementAccess: true })) continue;
                    if (
                        settingsStore.useGrid.value &&
                        clientStore.useSnapping(event) &&
                        this.hasFeature(SelectFeatures.Snapping, features)
                    ) {
                        if (sel.blocksVision)
                            visionState.deleteFromTriangulation({
                                target: TriangulationTarget.VISION,
                                shape: sel.uuid,
                            });
                        if (sel.blocksMovement)
                            visionState.deleteFromTriangulation({
                                target: TriangulationTarget.MOVEMENT,
                                shape: sel.uuid,
                            });
                        sel.resizeToGrid(this.resizePoint, ctrlOrCmdPressed(event));
                        if (sel.blocksVision) {
                            visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: sel.uuid });
                            recalcVision = true;
                        }
                        if (sel.blocksMovement) {
                            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: sel.uuid });
                            recalcMovement = true;
                        }
                    }
                    if (!sel.preventSync) {
                        sendShapeSizeUpdate({ shape: sel, temporary: false });
                    }

                    if (this.operationList?.type === "resize") {
                        this.operationList.toPoint = toArrayP(l2g(lp));
                        this.operationList.resizePoint = this.resizePoint;
                        this.operationList.retainAspectRatio = ctrlOrCmdPressed(event);
                        this.operationReady = true;
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
                        clientStore.useSnapping(event) &&
                        this.hasFeature(SelectFeatures.Snapping, features)
                    ) {
                        this.rotateSelection(newAngle, rotationCenter, false);
                    } else if (!sel.preventSync) sendShapePositionUpdate([sel], false);

                    if (this.operationList?.type === "rotation") {
                        this.operationList.shapes[s].to = sel.angle;
                        this.operationReady = true;
                    }

                    sel.updatePoints();
                }

                if (this.operationList?.type === "rotation") {
                    this.operationList.center = rotationCenter;
                }
            }

            if (recalcVision) visionState.recalculateVision(layerSelection[0].floor.id);
            if (recalcMovement) visionState.recalculateMovement(layerSelection[0].floor.id);
            layer.invalidate(false);

            if (this.mode !== SelectOperations.Rotate) {
                this.removeRotationUi();
                this.createRotationUi(features);
            }
        }

        if (this.operationReady) addOperation(this.operationList!);

        this.hasSelection.value = layerSelection.length > 0;
        this.setToolPermissions();

        this.mode = SelectOperations.Noop;
    }

    onContextMenu(event: MouseEvent, features: ToolFeatures<SelectFeatures>): void {
        if (!this.hasFeature(SelectFeatures.Context, features)) return;
        if (floorStore.currentLayer === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = floorStore.currentLayer.value!;
        const layerSelection = selectionState.get({ includeComposites: false });
        const mouse = getLocalPointFromEvent(event);
        const globalMouse = l2g(mouse);
        for (const shape of layerSelection) {
            if (shape.contains(globalMouse)) {
                layer.invalidate(true);
                openShapeContextMenu(event);
                return;
            }
        }

        // Check if any other shapes are under the mouse
        for (let i = layer.size({ includeComposites: false }) - 1; i >= 0; i--) {
            const shape = layer.getShapes({ includeComposites: false })[i];
            if (shape.contains(globalMouse)) {
                selectionState.set(shape);
                layer.invalidate(true);
                openShapeContextMenu(event);
                return;
            }
        }
        // Fallback to default context menu
        openDefaultContextMenu(event);
    }

    onKeyUp(event: KeyboardEvent, features: ToolFeatures): void {
        if (event.defaultPrevented) return;
        if (event.key === " " && this.active) {
            event.preventDefault();
        }
        super.onKeyUp(event, features);
    }

    // ROTATION

    createRotationUi(features: ToolFeatures<SelectFeatures>): void {
        const layer = floorStore.currentLayer.value!;

        const layerSelection = selectionState.get({ includeComposites: false });

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

        const topCenter = toGP((bbox.topRight.x + bbox.topLeft.x) / 2, bbox.topLeft.y);
        const topCenterPlus = addP(topCenter, new Vector(0, -DEFAULT_GRID_SIZE));

        this.angle = 0;
        this.rotationAnchor = new Line(topCenter, topCenterPlus, { lineWidth: l2gz(1.5), strokeColour: "#7c253e" });
        this.rotationBox = new Rect(bbox.topLeft, bbox.w, bbox.h, {
            fillColour: "rgba(0,0,0,0)",
            strokeColour: "#7c253e",
        });
        this.rotationBox.strokeWidth = 1.5;
        this.rotationEnd = new Circle(topCenterPlus, l2gz(4), { fillColour: "#7c253e", strokeColour: "rgba(0,0,0,0)" });

        for (const rotationShape of [this.rotationAnchor, this.rotationBox, this.rotationEnd]) {
            rotationShape.addOwner({ user: clientStore.state.username, access: { edit: true } }, SyncTo.SHAPE);
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

    resetRotationHelper(): void {
        selectTool.removeRotationUi();
        if (activeToolMode.value === ToolMode.Build) {
            selectTool.createRotationUi({});
        }
    }

    rotateSelection(newAngle: number, center: GlobalPoint, temporary: boolean): void {
        const layer = floorStore.currentLayer.value!;
        const dA = newAngle - this.angle;
        this.angle = newAngle;
        const layerSelection = selectionState.get({ includeComposites: false });

        rotateShapes(layerSelection, dA, center, temporary);

        this.rotationEnd!.rotateAround(center, dA);
        this.rotationAnchor!.rotateAround(center, dA);
        this.rotationBox!.angle = this.angle;
        layer.invalidate(false);
    }

    // CURSOR

    updateCursor(globalMouse: GlobalPoint): void {
        let cursorStyle = "default";
        const layerSelection = selectionState.get({ includeComposites: false });
        for (const sel of layerSelection) {
            const resizePoint = sel.getPointIndex(globalMouse, l2gz(3));
            if (resizePoint < 0) {
                // test rotate case
                if (this.rotationUiActive) {
                    const anchor = this.rotationAnchor!.points[1];
                    if (equalPoints(anchor, toArrayP(globalMouse), 10)) {
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
}

export const selectTool = new SelectTool();
