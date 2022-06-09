import { ref, watchEffect } from "vue";
import { POSITION, useToast } from "vue-toastification";

import { g2l, g2lx, g2ly, g2lz, l2g, l2gz, toDegrees, toRadians } from "../../../core/conversions";
import {
    addP,
    toArrayP,
    toGP,
    toLP,
    Ray,
    Vector,
    getPointDistance,
    getDistanceToSegment,
    getAngleBetween,
} from "../../../core/geometry";
import type { GlobalPoint, LocalPoint } from "../../../core/geometry";
import { baseAdjust } from "../../../core/http";
import { equalPoints, snapToPoint } from "../../../core/math";
import { InvalidationMode, NO_SYNC, SyncMode } from "../../../core/models/types";
import { ctrlOrCmdPressed } from "../../../core/utils";
import { i18n } from "../../../i18n";
import { clientStore, DEFAULT_GRID_SIZE } from "../../../store/client";
import { floorStore } from "../../../store/floor";
import { gameStore } from "../../../store/game";
import { settingsStore } from "../../../store/settings";
import { sendRequest } from "../../api/emits/logic";
import { sendShapePositionUpdate, sendShapeSizeUpdate } from "../../api/emits/shape/core";
import { calculateDelta } from "../../drag";
import { getGlobalId, getShape } from "../../id";
import type { LocalId } from "../../id";
import { getLocalPointFromEvent } from "../../input/mouse";
import { selectionState } from "../../layers/selection";
import { LayerName } from "../../models/floor";
import { ToolMode, ToolName } from "../../models/tools";
import type { ISelectTool, ToolFeatures, ToolPermission } from "../../models/tools";
import type { Operation } from "../../operations/model";
import { moveShapes } from "../../operations/movement";
import { resizeShape } from "../../operations/resize";
import { rotateShapes } from "../../operations/rotation";
import { addOperation } from "../../operations/undo";
import type { IShape } from "../../shapes/interfaces";
import type { BoundingRect } from "../../shapes/variants/boundingRect";
import { Circle } from "../../shapes/variants/circle";
import { Line } from "../../shapes/variants/line";
import type { Polygon } from "../../shapes/variants/polygon";
import { Rect } from "../../shapes/variants/rect";
import { accessSystem } from "../../systems/access";
import { doorSystem } from "../../systems/logic/door";
import { Access } from "../../systems/logic/models";
import { teleportZoneSystem } from "../../systems/logic/tp";
import { openDefaultContextMenu, openShapeContextMenu } from "../../ui/contextmenu/state";
import { TriangulationTarget, visionState } from "../../vision/state";
import { Tool } from "../tool";
import { activeToolMode, getFeatures } from "../tools";

import { RulerFeatures, rulerTool } from "./ruler";

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
    PolygonEdit,
}

const toast = useToast();

// Calculate 45 degrees in radians just once
const ANGLE_SNAP = (45 * Math.PI) / 180;

const rulerPermission = { name: ToolName.Ruler, features: { enabled: [RulerFeatures.All] }, early: true };

class SelectTool extends Tool implements ISelectTool {
    readonly toolName = ToolName.Select;
    readonly toolTranslation = i18n.global.t("tool.Select");

    // REACTIVE PROPERTIES
    hasSelection = ref(false);
    showRuler = ref(false);

    polygonUiLeft = ref("0px");
    polygonUiTop = ref("0px");
    polygonUiAngle = ref("0deg");
    polygonUiVisible = ref("hidden");
    polygonUiSizeX = ref("25px");
    polygonUiSizeY = ref("25px");
    polygonUiVertex = ref(false);

    // NON REACTIVE PROPERTIES

    mode = SelectOperations.Noop;

    lastMousePosition = toGP(0, 0);

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

    // polygon-edit related
    polygonTracer: Circle | null = null;

    hoveredDoor?: LocalId;

    private permittedTools_: ToolPermission[] = [];

    get permittedTools(): ToolPermission[] {
        return this.permittedTools_;
    }

    constructor() {
        super();

        watchEffect(() => {
            const selection = selectionState.state.selection;

            // rotation logic
            if (selection.size === 0) {
                this.removeRotationUi();
            }

            // polygon edit ui logic
            if (this.active.value || selection.size !== 1) {
                this.removePolygonEditUi();
            } else {
                const features = getFeatures(this.toolName);
                if (this.hasFeature(SelectFeatures.PolygonEdit, features)) {
                    const uuid = [...selection.values()][0];
                    if (getShape(uuid)!.type === "polygon") {
                        return this.createPolygonEditUi();
                    }
                }
                this.removePolygonEditUi();
            }
        });
    }

    checkRuler(): boolean {
        const rulerEnabled = this.permittedTools_.some((t) => t.name === ToolName.Ruler);
        if (this.showRuler.value && this.hasSelection.value) {
            if (!rulerEnabled) {
                this.permittedTools_.push(rulerPermission);
                return true;
            }
        } else if (rulerEnabled) {
            this.permittedTools_ = this.permittedTools_.filter((t) => t.name !== ToolName.Ruler);
        }
        return false;
    }

    onToolsModeChange(mode: ToolMode, features: ToolFeatures<SelectFeatures>): void {
        if (mode === ToolMode.Play) {
            document.body.style.cursor = "default";
            this.removeRotationUi();
            this.removePolygonEditUi();
        } else {
            if (this.hasFeature(SelectFeatures.Rotate, features)) {
                this.createRotationUi(features);
            }
            if (this.hasFeature(SelectFeatures.PolygonEdit, features)) {
                this.createPolygonEditUi();
            }
        }
    }

    onDeselect(): void {
        this.removePolygonEditUi();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async onSelect(): Promise<void> {
        const features = getFeatures(this.toolName);
        if (this.hasFeature(SelectFeatures.PolygonEdit, features)) {
            this.createPolygonEditUi();
            this.polygonUiVisible.value = "hidden";
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

        // Logic Door Check
        if (this.hoveredDoor !== undefined && activeToolMode.value === ToolMode.Play) {
            const canUseDoor = doorSystem.canUse(this.hoveredDoor);
            if (canUseDoor === Access.Enabled) {
                doorSystem.toggleDoor(this.hoveredDoor);
                const state = doorSystem.getCursorState(this.hoveredDoor);
                if (state !== undefined) {
                    document.body.style.cursor = `url('${baseAdjust(`static/img/${state}.svg`)}') 16 16, auto`;
                }
                return;
            } else if (canUseDoor === Access.Request) {
                toast.info("Request to open door sent", {
                    position: POSITION.TOP_RIGHT,
                });
                sendRequest({ door: getGlobalId(this.hoveredDoor), logic: "door" });
                return;
            }
        }

        this.operationReady = false;
        this.operationList = undefined;

        let hit = false;

        // The selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
        const layerSelection = selectionState.get({ includeComposites: false });
        let selectionStack: readonly IShape[];
        if (this.hasFeature(SelectFeatures.ChangeSelection, features)) {
            const shapes = layer.getShapes({ includeComposites: false });
            if (!layerSelection.length) selectionStack = shapes;
            else selectionStack = shapes.concat(layerSelection);
        } else {
            selectionStack = layerSelection;
        }

        for (let i = selectionStack.length - 1; i >= 0; i--) {
            const shape = selectionStack[i];
            if (!(shape.options.preFogShape ?? false) && (shape.options.skipDraw ?? false)) continue;
            if ([this.rotationAnchor?.id, this.rotationBox?.id, this.rotationEnd?.id].includes(shape.id)) continue;
            if (shape.isInvisible && !accessSystem.hasAccessTo(shape.id, false, { movement: true })) continue;

            if (this.rotationUiActive && this.hasFeature(SelectFeatures.Rotate, features)) {
                const anchor = this.rotationAnchor!.points[1];
                if (equalPoints(anchor, toArrayP(gp), 10)) {
                    this.mode = SelectOperations.Rotate;
                    hit = true;

                    this.operationList = { type: "rotation", center: toGP(0, 0), shapes: [] };
                    for (const shape of selectionState.get({ includeComposites: false }))
                        this.operationList.shapes.push({ uuid: shape.id, from: shape.angle, to: 0 });

                    break;
                }
            }
            if (this.hasFeature(SelectFeatures.Resize, features)) {
                this.resizePoint = shape.getPointIndex(gp, l2gz(5));
                if (this.resizePoint >= 0) {
                    // Resize case, a corner is selected
                    selectionState.set(shape);
                    this.removeRotationUi();
                    this.createRotationUi(features);
                    const points = shape.points; // expensive call
                    this.originalResizePoints = points;
                    this.mode = SelectOperations.Resize;
                    layer.invalidate(true);
                    hit = true;

                    this.operationList = {
                        type: "resize",
                        uuid: shape.id,
                        fromPoint: points[this.resizePoint],
                        toPoint: points[this.resizePoint],
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
                } else {
                    if (ctrlOrCmdPressed(event)) {
                        selectionState.remove(shape.id);
                    }
                }
                // Drag case, a shape is selected
                if (this.hasFeature(SelectFeatures.Drag, features)) {
                    this.mode = SelectOperations.Drag;
                    const localRefPoint = g2l(shape.refPoint);
                    this.dragRay = Ray.fromPoints(localRefPoint, lp);

                    // don't use layerSelection here as it can be outdated by the pushSelection setSelection above
                    this.operationList = { type: "movement", shapes: [] };
                    for (const shape of selectionState.get({ includeComposites: false })) {
                        this.operationList.shapes.push({
                            uuid: shape.id,
                            from: toArrayP(shape.refPoint),
                            to: toArrayP(shape.refPoint),
                        });
                        if (shape.blocksMovement && shape.layer.name === LayerName.Tokens) {
                            visionState.removeBlocker(TriangulationTarget.MOVEMENT, shape.floor.id, shape, true);
                        }
                    }
                }
                layer.invalidate(true);
                hit = true;
                break;
            }
        }

        this.hasSelection.value = hit;

        // GroupSelect case, draw a selection box to select multiple shapes
        if (!hit) {
            if (!this.hasFeature(SelectFeatures.ChangeSelection, features)) return;
            if (!this.hasFeature(SelectFeatures.GroupSelect, features)) return;
            this.mode = SelectOperations.GroupSelect;

            this.selectionStartPoint = gp;

            if (this.selectionHelper === undefined) {
                this.selectionHelper = new Rect(this.selectionStartPoint, 0, 0, {
                    fillColour: "rgba(0, 0, 0, 0)",
                    strokeColour: ["#7c253e"],
                    isSnappable: false,
                });
                this.selectionHelper.strokeWidth = 2;
                this.selectionHelper.options.UiHelper = true;
                accessSystem.addAccess(
                    this.selectionHelper.id,
                    clientStore.state.username,
                    { edit: true, movement: true, vision: true },
                    NO_SYNC,
                );
                layer.addShape(this.selectionHelper, SyncMode.NO_SYNC, InvalidationMode.NO);
            } else {
                this.selectionHelper.refPoint = this.selectionStartPoint;
                this.selectionHelper.w = 0;
                this.selectionHelper.h = 0;
            }

            if (!ctrlOrCmdPressed(event)) {
                selectionState.clear();
            }

            if (this.rotationUiActive) {
                this.removeRotationUi();
            }

            layer.invalidate(true);
        }
        if (this.checkRuler()) {
            rulerTool.onDown(lp, event);
        }
        if (this.mode !== SelectOperations.Noop) this.active.value = true;
    }

    async onMove(
        lp: LocalPoint,
        event: MouseEvent | TouchEvent,
        features: ToolFeatures<SelectFeatures>,
    ): Promise<void> {
        // if we only have context capabilities, immediately skip
        if (features.enabled?.length === 1 && features.enabled[0] === SelectFeatures.Context) return;

        const gp = l2g(lp);
        this.lastMousePosition = gp;

        // Logic hover
        if (!this.active.value && activeToolMode.value === ToolMode.Play) {
            let foundDoor = false;
            for (const id of doorSystem.getDoors()) {
                const shape = getShape(id);
                if (shape === undefined) continue;
                if (shape.floor.id !== floorStore.currentFloor.value!.id) continue;
                if (!shape.contains(gp)) continue;
                if (doorSystem.canUse(id) === Access.Disabled) continue;

                foundDoor = true;
                this.hoveredDoor = id;
                const state = doorSystem.getCursorState(id);
                document.body.style.cursor = `url('${baseAdjust(`static/img/${state}.svg`)}') 16 16, auto`;
                break;
            }
            if (!foundDoor) {
                this.hoveredDoor = undefined;
                document.body.style.cursor = "default";
            }
        }

        // We require move for the resize and rotate cursors
        if (
            !this.active.value &&
            !(
                this.hasFeature(SelectFeatures.Resize, features) ||
                this.hasFeature(SelectFeatures.Rotate, features) ||
                this.hasFeature(SelectFeatures.PolygonEdit, features)
            )
        )
            return;

        const layer = floorStore.currentLayer.value;
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        const layerSelection = selectionState.get({ includeComposites: false });
        if (layerSelection.some((s) => s.isLocked)) return;

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
                        if (!accessSystem.hasAccessTo(sel.id, false, { movement: true })) continue;
                        delta = calculateDelta(delta, sel, true);
                        if (delta !== ogDelta) this.deltaChanged = true;
                    }
                }

                await moveShapes(layerSelection, delta, true);

                if (!this.deltaChanged) {
                    this.dragRay = Ray.fromPoints(this.dragRay.origin, lp);
                }

                if (this.rotationUiActive) {
                    this.removeRotationUi();
                    this.createRotationUi(features);
                }

                if (this.hasFeature(SelectFeatures.PolygonEdit, features)) {
                    this.updatePolygonEditUi(gp);
                }

                layer.invalidate(false);
            } else if (this.mode === SelectOperations.Resize) {
                const shape = layerSelection[0];

                if (!accessSystem.hasAccessTo(shape.id, false, { movement: true })) return;

                let ignorePoint: GlobalPoint | undefined;
                if (this.resizePoint >= 0) ignorePoint = toGP(this.originalResizePoints[this.resizePoint]);
                let targetPoint = gp;
                if (clientStore.useSnapping(event) && this.hasFeature(SelectFeatures.Snapping, features))
                    [targetPoint, this.snappedToPoint] = snapToPoint(floorStore.currentLayer.value!, gp, ignorePoint);
                else this.snappedToPoint = false;

                this.resizePoint = resizeShape(shape, targetPoint, this.resizePoint, ctrlOrCmdPressed(event), true);
                this.updateCursor(gp, features);
            } else if (this.mode === SelectOperations.Rotate) {
                const center = this.rotationBox!.center();
                const newAngle = -Math.atan2(center.y - gp.y, gp.x - center.x) + Math.PI / 2;
                this.rotateSelection(newAngle, center, true);
            } else {
                this.updateCursor(gp, features);
            }
        } else {
            document.body.style.cursor = "default";
        }
    }

    async onUp(lp: LocalPoint, event: MouseEvent | TouchEvent, features: ToolFeatures<SelectFeatures>): Promise<void> {
        // if we only have context capabilities, immediately skip
        if (features.enabled?.length === 1 && features.enabled[0] === SelectFeatures.Context) {
            // When using pan during select, the dragray will use a wrong lp to to the drag calculation in move
            // Maybe consider using a gp for the ray instead to avoid this in the future ?
            this.dragRay = Ray.fromPoints(this.dragRay.origin, lp);
            return;
        }

        if (!this.active.value) return;
        this.active.value = false;

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
                selectionState.clear();
            }
            const cbbox = this.selectionHelper!.getBoundingBox();
            for (const shape of layer.getShapes({ includeComposites: false })) {
                if (!(shape.options.preFogShape ?? false) && (shape.options.skipDraw ?? false)) continue;
                if (!accessSystem.hasAccessTo(shape.id, false, { movement: true })) continue;
                if (!shape.visibleInCanvas({ w: layer.width, h: layer.height }, { includeAuras: false })) continue;
                if (layerSelection.some((s) => s.id === shape.id)) continue;

                const points = shape.points; // expensive call
                if (points.length > 1) {
                    for (let i = 0; i < points.length; i++) {
                        const ray = Ray.fromPoints(toGP(points[i]), toGP(points[(i + 1) % points.length]));
                        if (cbbox.containsRay(ray).hit) {
                            selectionState.push(shape);
                            i = points.length; // break out of the inner loop
                        }
                    }
                } else {
                    if (cbbox.contains(toGP(points[0]))) {
                        selectionState.push(shape);
                    }
                }
            }

            layerSelection = selectionState.get({ includeComposites: false });

            layer.removeShape(this.selectionHelper!, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
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
                    if (!accessSystem.hasAccessTo(sel.id, false, { movement: true })) continue;

                    if (
                        this.dragRay.origin!.x === g2lx(sel.refPoint.x) &&
                        this.dragRay.origin!.y === g2ly(sel.refPoint.y)
                    )
                        continue;

                    // movementBlock is skipped during onMove and definitely has to be done here
                    if (sel.blocksMovement) {
                        visionState.deleteFromTriangulation({
                            target: TriangulationTarget.MOVEMENT,
                            shape: sel.id,
                        });
                    }
                    if (
                        settingsStore.useGrid.value &&
                        clientStore.useSnapping(event) &&
                        this.hasFeature(SelectFeatures.Snapping, features) &&
                        !this.deltaChanged
                    ) {
                        if (sel.blocksVision) {
                            visionState.deleteFromTriangulation({
                                target: TriangulationTarget.VISION,
                                shape: sel.id,
                            });
                        }

                        sel.snapToGrid();

                        if (sel.blocksVision) {
                            visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: sel.id });
                            recalcVision = true;
                        }
                    }
                    // movementBlock is skipped during onMove and definitely has to be done here
                    if (sel.blocksMovement) {
                        if (sel.layer.name === LayerName.Tokens)
                            visionState.addBlocker(TriangulationTarget.MOVEMENT, sel.id, sel.floor.id, false);
                        visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: sel.id });
                        recalcMovement = true;
                    }

                    if (this.operationList?.type === "movement") {
                        this.operationList.shapes[s].to = toArrayP(sel.refPoint);
                        this.operationReady = true;
                    }

                    if (sel.blocksVision) recalcVision = true;
                    if (sel.blocksMovement) recalcMovement = true;
                    if (!sel.preventSync) updateList.push(sel);
                    sel.updateLayerPoints();
                }
                sendShapePositionUpdate(updateList, false);

                await teleportZoneSystem.checkTeleport(selectionState.get({ includeComposites: true }));
            }
            if (this.mode === SelectOperations.Resize) {
                for (const sel of layerSelection) {
                    if (!accessSystem.hasAccessTo(sel.id, false, { movement: true })) continue;

                    // movementBlock is skipped during onMove and definitely has to be done here
                    if (sel.blocksMovement)
                        visionState.deleteFromTriangulation({
                            target: TriangulationTarget.MOVEMENT,
                            shape: sel.id,
                        });

                    if (
                        settingsStore.useGrid.value &&
                        clientStore.useSnapping(event) &&
                        this.hasFeature(SelectFeatures.Snapping, features)
                    ) {
                        if (sel.blocksVision)
                            visionState.deleteFromTriangulation({
                                target: TriangulationTarget.VISION,
                                shape: sel.id,
                            });
                        sel.resizeToGrid(this.resizePoint, ctrlOrCmdPressed(event));
                        if (sel.blocksVision) {
                            visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: sel.id });
                            recalcVision = true;
                        }
                    }

                    // movementBlock is skipped during onMove and definitely has to be done here
                    if (sel.blocksMovement) {
                        visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: sel.id });
                        recalcMovement = true;
                    }

                    if (!sel.preventSync) {
                        sendShapeSizeUpdate({ shape: sel, temporary: false });
                    }

                    if (this.operationList?.type === "resize") {
                        this.operationList.toPoint = sel.points[this.resizePoint];
                        this.operationList.resizePoint = this.resizePoint;
                        this.operationList.retainAspectRatio = ctrlOrCmdPressed(event);
                        this.operationReady = true;
                    }

                    sel.updateLayerPoints();
                }
            }
            if (this.mode === SelectOperations.Rotate) {
                const rotationCenter = this.rotationBox!.center();

                for (const [s, sel] of layerSelection.entries()) {
                    if (!accessSystem.hasAccessTo(sel.id, false, { movement: true })) continue;

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

                    sel.updateLayerPoints();
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
        if (event.key === " " && this.active.value) {
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
        this.rotationAnchor = new Line(topCenter, topCenterPlus, {
            lineWidth: l2gz(1.5),
            strokeColour: ["#7c253e"],
            isSnappable: false,
        });
        this.rotationBox = new Rect(bbox.topLeft, bbox.w, bbox.h, {
            fillColour: "rgba(0,0,0,0)",
            strokeColour: ["#7c253e"],
            isSnappable: false,
        });
        this.rotationBox.strokeWidth = 1.5;
        this.rotationEnd = new Circle(topCenterPlus, l2gz(4), {
            fillColour: "#7c253e",
            strokeColour: ["rgba(0,0,0,0)"],
            isSnappable: false,
        });

        for (const rotationShape of [this.rotationAnchor, this.rotationBox, this.rotationEnd]) {
            accessSystem.addAccess(
                rotationShape.id,
                clientStore.state.username,
                { edit: true, movement: true, vision: true },
                NO_SYNC,
            );
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
            layer.removeShape(this.rotationAnchor!, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
            layer.removeShape(this.rotationBox!, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
            layer.removeShape(this.rotationEnd!, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
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

    // POLYGON EDIT

    createPolygonEditUi(): void {
        const selection = selectionState.get({ includeComposites: false });
        if (selection.length !== 1 || selection[0].type !== "polygon") return;

        this.removePolygonEditUi();

        this.polygonTracer = new Circle(toGP(0, 0), 3, {
            fillColour: "rgba(0,0,0,0)",
            strokeColour: ["black"],
            isSnappable: false,
        });
        const drawLayer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Draw)!;
        drawLayer.addShape(this.polygonTracer, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        this.updatePolygonEditUi(this.lastMousePosition);
        drawLayer.invalidate(true);
    }

    removePolygonEditUi(): void {
        if (this.polygonTracer !== null) {
            const drawLayer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Draw)!;
            drawLayer.removeShape(this.polygonTracer, {
                sync: SyncMode.NO_SYNC,
                recalculate: false,
                dropShapeId: true,
            });
            drawLayer.invalidate(true);
            this.polygonTracer = null;
            this.polygonUiVisible.value = "hidden";
        }
    }

    updatePolygonEditUi(gp: GlobalPoint): void {
        if (this.polygonTracer === null) return;
        const selection = selectionState.get({ includeComposites: false });
        const polygon = selection[0] as Polygon;

        const pw = g2lz(polygon.lineWidth[0]);

        const pv = polygon.vertices;
        let smallest = { distance: polygon.lineWidth[0] * 2, nearest: gp, angle: 0, point: false };
        for (let i = 1; i < pv.length; i++) {
            const prevVertex = pv[i - 1];
            const vertex = pv[i];
            // check prev-vertex
            if (getPointDistance(prevVertex, gp) < polygon.lineWidth[0] / 1.5) {
                const vec = Vector.fromPoints(prevVertex, vertex);
                let angle;
                if (i === 1) {
                    angle = vec.deg();
                } else {
                    const between = getAngleBetween(Vector.fromPoints(prevVertex, pv[i - 2]), vec) / 2;
                    angle = (Math.abs(between) < Math.PI / 2 ? 1 : -1) * 90 - toDegrees(-vec.angle() + between);
                }
                smallest = { distance: 0, nearest: prevVertex, point: true, angle };
                break;
            }
            // check edge
            const info = getDistanceToSegment(gp, [prevVertex, vertex]);
            if (info.distance < polygon.lineWidth[0] / 1.5 && info.distance < smallest.distance) {
                smallest = { ...info, angle: Vector.fromPoints(prevVertex, vertex).deg(), point: false };
            }
        }
        //check last vertex
        if (getPointDistance(pv.at(-1)!, gp) < polygon.lineWidth[0] / 2) {
            smallest = { distance: 0, nearest: pv.at(-1)!, point: true, angle: smallest.angle };
        }
        // Show the UI
        if (smallest.distance <= polygon.lineWidth[0]) {
            this.polygonUiVisible.value = "visible";
            this.polygonTracer!.refPoint = smallest.nearest;
            this.polygonTracer!.layer.invalidate(true);
            const lp = g2l(smallest.nearest);
            const radians = toRadians(smallest.angle);
            this.polygonUiLeft.value = `${lp.x - 25}px`;
            this.polygonUiTop.value = `${lp.y - 25 / 2}px`;
            this.polygonUiAngle.value = `${smallest.angle}deg`;
            // 12.5 + pw/2 is the exact border, additional scaling to give a bit of air
            this.polygonUiSizeX.value = `${-Math.sin(radians) * (15 + (1.5 * pw) / 2)}px`;
            this.polygonUiSizeY.value = `${Math.cos(radians) * (15 + (1.5 * pw) / 2)}px`;
            this.polygonUiVertex.value = smallest.point;
        }
    }

    // CURSOR

    updateCursor(globalMouse: GlobalPoint, features: ToolFeatures<SelectFeatures>): void {
        let cursorStyle = "default";
        const layerSelection = selectionState.get({ includeComposites: false });
        for (const sel of layerSelection) {
            const resizePoint = sel.getPointIndex(globalMouse, l2gz(4));
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
                let angle = sel.getPointOrientation(resizePoint).deg();
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

        if (this.hasFeature(SelectFeatures.PolygonEdit, features)) {
            this.updatePolygonEditUi(globalMouse);
        }
    }
}

export const selectTool = new SelectTool();
