import { watch, watchEffect } from "vue";
import { POSITION, useToast } from "vue-toastification";

import { g2l, g2lx, g2ly, g2lz, l2g, l2gz, toDegrees, toRadians } from "../../../../core/conversions";
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
} from "../../../../core/geometry";
import type { GlobalPoint, LocalPoint } from "../../../../core/geometry";
import { DEFAULT_GRID_SIZE } from "../../../../core/grid";
import { baseAdjust } from "../../../../core/http";
import { equalPoints, rotateAroundPoint, snapToPoint } from "../../../../core/math";
import { InvalidationMode, NO_SYNC, SyncMode } from "../../../../core/models/types";
import { ctrlOrCmdPressed } from "../../../../core/utils";
import { i18n } from "../../../../i18n";
import { sendRequest } from "../../../api/emits/logic";
import { sendShapePositionUpdate, sendShapeSizeUpdate } from "../../../api/emits/shape/core";
import { calculateDelta } from "../../../drag";
import { getGlobalId, getShape } from "../../../id";
import { getLocalPointFromEvent } from "../../../input/mouse";
import type { IShape } from "../../../interfaces/shape";
import { LayerName } from "../../../models/floor";
import { ToolMode, ToolName } from "../../../models/tools";
import type { ISelectTool, ToolFeatures, ToolPermission } from "../../../models/tools";
import type { Operation } from "../../../operations/model";
import { moveShapes } from "../../../operations/movement";
import { resizeShape } from "../../../operations/resize";
import { rotateShapes } from "../../../operations/rotation";
import { addOperation } from "../../../operations/undo";
import { Circle } from "../../../shapes/variants/circle";
import { Line } from "../../../shapes/variants/line";
import type { Polygon } from "../../../shapes/variants/polygon";
import { Rect } from "../../../shapes/variants/rect";
import type { BoundingRect } from "../../../shapes/variants/simple/boundingRect";
import { accessSystem } from "../../../systems/access";
import { floorSystem } from "../../../systems/floors";
import { floorState } from "../../../systems/floors/state";
import { gameState } from "../../../systems/game/state";
import { doorSystem } from "../../../systems/logic/door";
import { Access } from "../../../systems/logic/models";
import { teleportZoneSystem } from "../../../systems/logic/tp";
import { playerSystem } from "../../../systems/players";
import { positionState } from "../../../systems/position/state";
import { getProperties } from "../../../systems/properties/state";
import { VisionBlock } from "../../../systems/properties/types";
import { selectedSystem } from "../../../systems/selected";
import { collapseSelection, expandSelection } from "../../../systems/selected/collapse";
import { selectedState } from "../../../systems/selected/state";
import { locationSettingsState } from "../../../systems/settings/location/state";
import { playerSettingsState } from "../../../systems/settings/players/state";
import { openDefaultContextMenu, openShapeContextMenu } from "../../../ui/contextmenu/state";
import { TriangulationTarget, visionState } from "../../../vision/state";
import { SelectFeatures } from "../../models/select";
import { Tool } from "../../tool";
import { activeToolMode, getFeatures } from "../../tools";
import { RulerFeatures, rulerTool } from "../ruler";

import { selectToolState } from "./state";

enum SelectOperations {
    Noop,
    Resize,
    Drag,
    GroupSelect,
    Rotate,
}

const toast = useToast();

// Calculate 45 degrees in radians just once
const ANGLE_SNAP = (45 * Math.PI) / 180;

const rulerPermission = { name: ToolName.Ruler, features: { enabled: [RulerFeatures.All] }, early: true };

const { _, _$ } = selectToolState;

class SelectTool extends Tool implements ISelectTool {
    readonly toolName = ToolName.Select;
    readonly toolTranslation = i18n.global.t("tool.Select");

    // NON REACTIVE PROPERTIES

    mode = SelectOperations.Noop;

    lastMousePosition = toGP(0, 0);

    // This is stored to ensure that we don't push changes to the selection too early.
    // Originally we pushed these to the selection system immediately on mouseDown,
    // but events like blur or change on input fields trigger _after_ mouseDown,
    // causing these event handlers to potentially run against the wrong selection.
    currentSelection: IShape[] = [];

    angle = 0;
    rotationUiActive = false;
    rotationAnchor?: Line;
    rotationBox?: Rect;
    rotationEnd?: Circle;

    resizePoint = 0;
    originalResizePoints: [number, number][] = [];

    deltaChanged = false;
    snappedToPoint = false;

    private selectionCollapsed = false;

    // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
    // we keep track of the actual offset within the asset.
    dragRay = new Ray<LocalPoint>(toLP(0, 0), new Vector(0, 0));
    selectionStartPoint = toGP(-1000, -1000);
    selectionHelper: Rect | undefined = undefined;

    operationReady = false;
    operationList?: Operation;

    // polygon-edit related
    polygonTracer: Circle | null = null;

    private permittedTools_: ToolPermission[] = [];

    get permittedTools(): ToolPermission[] {
        return this.permittedTools_;
    }

    constructor() {
        super();

        // Zoom changes
        watch(
            () => positionState.reactive.zoomDisplay,
            () => {
                if (this.rotationUiActive) {
                    this.resetRotationHelper();
                }
            },
        );

        // Selection changes
        watchEffect(() => {
            const selection = selectedState.reactive.selected;

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
                    if (uuid && getShape(uuid)!.type === "polygon") {
                        return this.createPolygonEditUi();
                    }
                }
                this.removePolygonEditUi();
            }
        });
    }

    checkRuler(): boolean {
        const rulerEnabled = this.permittedTools_.some((t) => t.name === ToolName.Ruler);
        if (_$.showRuler && _$.hasSelection) {
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

    onPanStart(): void {
        if (this.polygonTracer !== null) _$.polygonUiVisible = "hidden";
    }

    onPanEnd(): void {
        if (this.polygonTracer !== null) {
            this.updatePolygonEditUi(this.polygonTracer.refPoint);
            _$.polygonUiVisible = "visible";
        }
    }

    onDeselect(): void {
        this.removeRotationUi();
        this.removePolygonEditUi();
    }

    onSelect(): Promise<void> {
        const features = getFeatures(this.toolName);
        if (this.hasFeature(SelectFeatures.PolygonEdit, features)) {
            this.createPolygonEditUi();
            _$.polygonUiVisible = "hidden";
        }
        if (this.hasFeature(SelectFeatures.Rotate, features)) {
            this.createRotationUi(features);
        }
        return Promise.resolve();
    }

    // Syncs the local state tracked selection state to the global selection state
    private syncSelection(): void {
        if (this.currentSelection.length === 0) {
            selectedSystem.clear();
        } else {
            selectedSystem.set(...this.currentSelection.map((s) => s.id));
        }
    }

    // INPUT HANDLERS

    async onDown(
        lp: LocalPoint,
        event: MouseEvent | TouchEvent | undefined,
        features: ToolFeatures<SelectFeatures>,
    ): Promise<void> {
        // if we only have context capabilities, immediately skip
        if (features.enabled?.length === 1 && features.enabled[0] === SelectFeatures.Context) return;

        const gp = l2g(lp);
        const layer = floorState.currentLayer.value;
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        // Logic Door Check
        if (_.hoveredDoor !== undefined && activeToolMode.value === ToolMode.Play) {
            if (gameState.raw.isDm) {
                doorSystem.toggleDoor(_.hoveredDoor);
                return;
            } else {
                if (doorSystem.canUse(_.hoveredDoor, playerSystem.getCurrentPlayerId()!) === Access.Request) {
                    toast.info("Request to open door sent", {
                        position: POSITION.TOP_RIGHT,
                    });
                }
                const door = getGlobalId(_.hoveredDoor);
                if (door) sendRequest({ door, logic: "door" });
                return;
            }
        }

        this.operationReady = false;
        this.operationList = undefined;

        let hit = false;

        // The selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
        this.currentSelection = [...selectedSystem.get({ includeComposites: false })];
        let selectionStack: readonly IShape[];
        if (this.hasFeature(SelectFeatures.ChangeSelection, features)) {
            const shapes = layer.getShapes({ includeComposites: false, onlyInView: true });
            if (!this.currentSelection.length) selectionStack = shapes;
            else selectionStack = shapes.concat(this.currentSelection);
        } else {
            selectionStack = this.currentSelection;
        }

        for (let i = selectionStack.length - 1; i >= 0; i--) {
            const shape = selectionStack[i]!;
            if (!(shape.options.preFogShape ?? false) && (shape.options.skipDraw ?? false)) continue;
            if ([this.rotationAnchor?.id, this.rotationBox?.id, this.rotationEnd?.id].includes(shape.id)) continue;
            // temp hack, should be fixed with a proper can't select feature
            // this is only used by noteIcons right now, but in the future parentIds might become useful for regular selectable shapes
            if (shape._parentId !== undefined) continue;
            const props = getProperties(shape.id)!;
            if (props.isInvisible && !accessSystem.hasAccessTo(shape.id, false, { movement: true })) continue;

            if (this.rotationUiActive && this.hasFeature(SelectFeatures.Rotate, features)) {
                const anchor = this.rotationAnchor!.points[1];
                if (anchor && equalPoints(anchor, toArrayP(gp), 10)) {
                    this.mode = SelectOperations.Rotate;
                    hit = true;

                    this.operationList = { type: "rotation", center: toGP(0, 0), shapes: [] };
                    for (const shape of this.currentSelection)
                        this.operationList.shapes.push({ uuid: shape.id, from: shape.angle, to: 0 });

                    break;
                }
            }
            if (this.hasFeature(SelectFeatures.Resize, features)) {
                this.resizePoint = shape.getPointIndex(gp, l2gz(5));
                if (this.resizePoint >= 0) {
                    // Resize case, a corner is selected
                    this.currentSelection = [shape];
                    this.removeRotationUi();
                    this.createRotationUi(features);
                    const points = shape.points;
                    this.originalResizePoints = points;
                    this.mode = SelectOperations.Resize;
                    layer.invalidate(true);
                    hit = true;

                    const targetPoint = points[this.resizePoint];
                    if (targetPoint !== undefined) {
                        this.operationList = {
                            type: "resize",
                            uuid: shape.id,
                            fromPoint: targetPoint,
                            toPoint: targetPoint,
                            resizePoint: this.resizePoint,
                            retainAspectRatio: false,
                        };
                    }

                    break;
                }
            }
            if (shape.contains(gp)) {
                const shapeSelectionIndex = this.currentSelection.findIndex((s) => s.id === shape.id);
                if (shapeSelectionIndex === -1) {
                    if (event && ctrlOrCmdPressed(event)) {
                        this.currentSelection.push(shape);
                    } else {
                        this.currentSelection = [shape];
                    }
                    this.removeRotationUi();
                    this.createRotationUi(features);
                } else {
                    if (event && ctrlOrCmdPressed(event)) {
                        this.currentSelection = this.currentSelection.filter((s) => s.id !== shape.id);
                    } else if (shapeSelectionIndex !== 0) {
                        // Move it to the front of the selection, so that it becomes the new focus
                        this.currentSelection.splice(shapeSelectionIndex, 1);
                        this.currentSelection.unshift(shape);
                    }
                }
                // Drag case, a shape is selected
                if (!props.isLocked && this.hasFeature(SelectFeatures.Drag, features)) {
                    this.mode = SelectOperations.Drag;
                    const localRefPoint = g2l(shape.refPoint);
                    this.dragRay = Ray.fromPoints(localRefPoint, lp);

                    // don't use layerSelection here as it can be outdated by the pushSelection setSelection above
                    this.operationList = { type: "movement", shapes: [] };
                    for (const shape of this.currentSelection) {
                        this.operationList.shapes.push({
                            uuid: shape.id,
                            from: toArrayP(shape.refPoint),
                            to: toArrayP(shape.refPoint),
                        });
                        if (props.blocksMovement && shape.layerName === LayerName.Tokens) {
                            if (shape.floorId !== undefined)
                                visionState.removeBlocker(TriangulationTarget.MOVEMENT, shape.floorId, shape, true);
                        }
                    }
                }
                layer.invalidate(true);
                hit = true;
                break;
            }
        }

        _$.hasSelection = hit;

        // GroupSelect case, draw a selection box to select multiple shapes
        if (!hit) {
            if (!this.hasFeature(SelectFeatures.ChangeSelection, features)) return;
            if (!this.hasFeature(SelectFeatures.GroupSelect, features)) return;
            this.mode = SelectOperations.GroupSelect;

            this.selectionStartPoint = gp;

            if (this.selectionHelper === undefined) {
                this.selectionHelper = new Rect(
                    this.selectionStartPoint,
                    0,
                    0,
                    {
                        isSnappable: false,
                    },
                    { fillColour: "rgba(0, 0, 0, 0)", strokeColour: ["#7c253e"] },
                );
                this.selectionHelper.strokeWidth = 2;
                this.selectionHelper.options.UiHelper = true;
                accessSystem.addAccess(
                    this.selectionHelper.id,
                    playerSystem.getCurrentPlayer()!.name,
                    { edit: true, movement: true, vision: true },
                    NO_SYNC,
                );
                layer.addShape(this.selectionHelper, SyncMode.NO_SYNC, InvalidationMode.NO);
            } else {
                this.selectionHelper.refPoint = this.selectionStartPoint;
                this.selectionHelper.w = 0;
                this.selectionHelper.h = 0;
            }

            if (!(event && ctrlOrCmdPressed(event))) {
                this.currentSelection = [];
            }

            if (this.rotationUiActive) {
                this.removeRotationUi();
            }

            layer.invalidate(true);
        }
        if (this.checkRuler()) {
            await rulerTool.onDown(lp, event);
        }
        if (this.mode !== SelectOperations.Noop) this.active.value = true;
    }

    async onMove(
        lp: LocalPoint,
        event: MouseEvent | TouchEvent | undefined,
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
                if (shape.floorId !== floorState.currentFloor.value!.id) continue;
                if (!shape.contains(gp)) continue;
                if (doorSystem.canUse(id, playerSystem.getCurrentPlayerId()!) === Access.Disabled) continue;

                foundDoor = true;
                _.hoveredDoor = id;
                const state = doorSystem.getCursorState(id);
                if (state !== undefined)
                    document.body.style.cursor = `url('${baseAdjust(`static/img/${state}.svg`)}') 16 16, auto`;
                break;
            }
            if (!foundDoor) {
                _.hoveredDoor = undefined;
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

        const layer = floorState.currentLayer.value;
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        if (this.currentSelection.some((s) => getProperties(s.id)!.isLocked)) return;

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
        } else if (this.currentSelection.length) {
            let delta = Ray.fromPoints(this.dragRay.get(this.dragRay.tMax), lp).direction.multiply(
                1 / positionState.readonly.zoom,
            );
            const ogDelta = delta;
            if (this.mode === SelectOperations.Drag) {
                if (ogDelta.length() === 0) return;
                // If we are on the tokens layer do a movement block check.
                if (layer.name === LayerName.Tokens && !(event?.shiftKey === true && gameState.raw.isDm)) {
                    for (const sel of this.currentSelection) {
                        if (!accessSystem.hasAccessTo(sel.id, false, { movement: true })) continue;
                        delta = calculateDelta(delta, sel, true);
                        if (delta !== ogDelta) this.deltaChanged = true;
                    }
                }

                await moveShapes(this.currentSelection, delta, true);

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
                const shape = this.currentSelection[0]!;

                if (!accessSystem.hasAccessTo(shape.id, false, { movement: true })) return;

                let targetPoint = gp;
                if (
                    event &&
                    playerSettingsState.useSnapping(event) &&
                    this.hasFeature(SelectFeatures.Snapping, features)
                )
                    [targetPoint, this.snappedToPoint] = snapToPoint(floorState.currentLayer.value!, gp, {
                        shape,
                        pointIndex: this.resizePoint,
                    });
                else this.snappedToPoint = false;

                this.resizePoint = resizeShape(
                    shape,
                    targetPoint,
                    this.resizePoint,
                    event !== undefined && ctrlOrCmdPressed(event),
                    true,
                );
            } else if (this.mode === SelectOperations.Rotate) {
                const center = this.rotationBox!.center;
                const newAngle = -Math.atan2(center.y - gp.y, gp.x - center.x) + Math.PI / 2;
                this.rotateSelection(newAngle, center, true);
            }
            // We also sync in onUp, which always runs,
            // however when we click and immediately drag a shape,
            // the selection won't appear until the onUp if we don't sync here as well
            this.syncSelection();
        }
        this.updateCursor(gp, features);
    }

    async onUp(
        lp: LocalPoint,
        event: MouseEvent | TouchEvent | undefined,
        features: ToolFeatures<SelectFeatures>,
    ): Promise<void> {
        // if we only have context capabilities, immediately skip
        if (features.enabled?.length === 1 && features.enabled[0] === SelectFeatures.Context) {
            // When using pan during select, the dragray will use a wrong lp to to the drag calculation in move
            // Maybe consider using a gp for the ray instead to avoid this in the future ?
            this.dragRay = Ray.fromPoints(this.dragRay.origin, lp);
            return;
        }

        if (!this.active.value) return;
        this.active.value = false;

        if (floorState.currentLayer.value === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = floorState.currentLayer.value;

        if (this.currentSelection.some((s) => getProperties(s.id)!.isLocked)) {
            // no-op - don't return because we need to run common logic afterwards
        } else if (this.mode === SelectOperations.GroupSelect) {
            if (event && ctrlOrCmdPressed(event)) {
                // If either control or shift are pressed, do not remove selection
            } else {
                this.currentSelection = [];
            }
            const cbbox = this.selectionHelper!.getBoundingBox();
            for (const shape of layer.getShapes({ includeComposites: false, onlyInView: true })) {
                if (!(shape.options.preFogShape ?? false) && (shape.options.skipDraw ?? false)) continue;
                if (!accessSystem.hasAccessTo(shape.id, false, { movement: true })) continue;
                if (!shape.visibleInCanvas({ w: layer.width, h: layer.height }, { includeAuras: false })) continue;
                if (this.currentSelection.some((s) => s.id === shape.id)) continue;
                if (shape.id === this.selectionHelper?.id) continue;

                const points = shape.points;
                if (points.length > 1) {
                    for (let i = 0; i < points.length; i++) {
                        const ray = Ray.fromPoints(toGP(points[i]!), toGP(points[(i + 1) % points.length]!));
                        if (cbbox.containsRay(ray).hit) {
                            this.currentSelection.push(shape);
                            i = points.length; // break out of the inner loop
                        }
                    }
                } else if (points.length === 1) {
                    if (cbbox.contains(toGP(points[0]!))) {
                        this.currentSelection.push(shape);
                    }
                }
            }

            layer.removeShape(this.selectionHelper!, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
            this.selectionHelper = undefined;

            if (this.currentSelection.some((s) => !getProperties(s.id)!.isLocked)) {
                this.currentSelection = this.currentSelection.filter((s) => !getProperties(s.id)!.isLocked);
            }

            if (
                this.currentSelection.length > 0 &&
                !this.rotationUiActive &&
                this.hasFeature(SelectFeatures.Rotate, features)
            ) {
                this.createRotationUi(features);
            }

            layer.invalidate(true);
        } else if (this.currentSelection.length) {
            let recalcVision = false;
            let recalcMovement = false;

            if (this.mode === SelectOperations.Drag) {
                const updateList = [];
                for (const [s, sel] of this.currentSelection.entries()) {
                    if (!accessSystem.hasAccessTo(sel.id, false, { movement: true })) continue;

                    if (
                        this.dragRay.origin.x === g2lx(sel.refPoint.x) &&
                        this.dragRay.origin.y === g2ly(sel.refPoint.y)
                    )
                        continue;

                    const props = getProperties(sel.id)!;

                    // movementBlock is skipped during onMove and definitely has to be done here
                    if (props.blocksMovement) {
                        visionState.deleteFromTriangulation({
                            target: TriangulationTarget.MOVEMENT,
                            shape: sel.id,
                        });
                    }
                    if (
                        event &&
                        locationSettingsState.raw.useGrid.value &&
                        playerSettingsState.useSnapping(event) &&
                        this.hasFeature(SelectFeatures.Snapping, features) &&
                        !this.deltaChanged
                    ) {
                        if (props.blocksVision !== VisionBlock.No) {
                            visionState.deleteFromTriangulation({
                                target: TriangulationTarget.VISION,
                                shape: sel.id,
                            });
                        }

                        sel.snapToGrid();

                        if (props.blocksVision !== VisionBlock.No) {
                            visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: sel.id });
                            recalcVision = true;
                        }
                    }
                    // movementBlock is skipped during onMove and definitely has to be done here
                    if (props.blocksMovement) {
                        if (sel.layerName === LayerName.Tokens) {
                            if (sel.floorId !== undefined)
                                visionState.addBlocker(TriangulationTarget.MOVEMENT, sel.id, sel.floorId, false);
                        }
                        visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: sel.id });
                        recalcMovement = true;
                    }

                    if (this.operationList?.type === "movement" && s < this.operationList.shapes.length) {
                        this.operationList.shapes[s]!.to = toArrayP(sel.refPoint);
                        this.operationReady = true;
                    }

                    if (props.blocksVision !== VisionBlock.No) recalcVision = true;
                    if (props.blocksMovement) recalcMovement = true;
                    if (!sel.preventSync) updateList.push(sel);
                }

                if (
                    this.selectionCollapsed &&
                    this.currentSelection.length === 1 &&
                    (this.currentSelection[0]!.options.collapsedIds?.length ?? 0) > 0
                ) {
                    this.selectionCollapsed = false;
                    await expandSelection(updateList);
                }

                sendShapePositionUpdate(updateList, false);

                await teleportZoneSystem.checkTeleport(selectedSystem.get({ includeComposites: true }));
            }
            if (this.mode === SelectOperations.Resize) {
                for (const sel of this.currentSelection) {
                    if (!accessSystem.hasAccessTo(sel.id, false, { movement: true })) continue;

                    const props = getProperties(sel.id)!;

                    // movementBlock is skipped during onMove and definitely has to be done here
                    if (props.blocksMovement)
                        visionState.deleteFromTriangulation({
                            target: TriangulationTarget.MOVEMENT,
                            shape: sel.id,
                        });

                    if (
                        event &&
                        locationSettingsState.raw.useGrid.value &&
                        playerSettingsState.useSnapping(event) &&
                        !this.snappedToPoint &&
                        this.hasFeature(SelectFeatures.Snapping, features)
                    ) {
                        if (props.blocksVision !== VisionBlock.No)
                            visionState.deleteFromTriangulation({
                                target: TriangulationTarget.VISION,
                                shape: sel.id,
                            });
                        sel.resizeToGrid(this.resizePoint, ctrlOrCmdPressed(event));
                        if (props.blocksVision !== VisionBlock.No) {
                            visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: sel.id });
                            recalcVision = true;
                        }
                    }

                    // movementBlock is skipped during onMove and definitely has to be done here
                    if (props.blocksMovement) {
                        visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: sel.id });
                        recalcMovement = true;
                    }

                    if (!sel.preventSync) {
                        sendShapeSizeUpdate({ shape: sel, temporary: false });
                    }

                    if (this.operationList?.type === "resize" && this.resizePoint < sel.points.length) {
                        this.operationList.toPoint = sel.points[this.resizePoint]!;
                        this.operationList.resizePoint = this.resizePoint;
                        this.operationList.retainAspectRatio = event !== undefined && ctrlOrCmdPressed(event);
                        this.operationReady = true;
                    }
                }
            }
            if (this.mode === SelectOperations.Rotate) {
                const rotationCenter = this.rotationBox!.center;

                for (const [s, sel] of this.currentSelection.entries()) {
                    if (!accessSystem.hasAccessTo(sel.id, false, { movement: true })) continue;

                    const newAngle = Math.round(this.angle / ANGLE_SNAP) * ANGLE_SNAP;
                    if (
                        event &&
                        newAngle !== this.angle &&
                        playerSettingsState.useSnapping(event) &&
                        this.hasFeature(SelectFeatures.Snapping, features)
                    ) {
                        this.rotateSelection(newAngle, rotationCenter, false);
                    } else if (!sel.preventSync) sendShapePositionUpdate([sel], false);

                    if (this.operationList?.type === "rotation" && s < this.operationList.shapes.length) {
                        this.operationList.shapes[s]!.to = sel.angle;
                        this.operationReady = true;
                    }
                }

                if (this.operationList?.type === "rotation") {
                    this.operationList.center = rotationCenter;
                }
            }

            const floorId = this.currentSelection[0]?.floorId;
            if (floorId !== undefined) {
                if (recalcVision) visionState.recalculateVision(floorId);
                if (recalcMovement) visionState.recalculateMovement(floorId);
            }
            layer.invalidate(false);

            if (this.mode !== SelectOperations.Rotate) {
                this.removeRotationUi();
                this.createRotationUi(features);
            }
        }

        if (this.operationReady) addOperation(this.operationList!);

        _$.hasSelection = this.currentSelection.length > 0;
        this.syncSelection();
        this.currentSelection = [];

        this.mode = SelectOperations.Noop;
    }

    onContextMenu(event: MouseEvent, features: ToolFeatures<SelectFeatures>): Promise<boolean> {
        if (!this.hasFeature(SelectFeatures.Context, features)) return Promise.resolve(true);
        if (floorState.currentLayer.value === undefined) {
            console.log("No active layer!");
            return Promise.resolve(true);
        }
        const layer = floorState.currentLayer.value;
        const layerSelection = selectedSystem.get({ includeComposites: false });
        const mouse = getLocalPointFromEvent(event);
        const globalMouse = l2g(mouse);

        // First check active selection
        for (const shape of layerSelection) {
            if (shape.contains(globalMouse)) {
                selectedSystem.focus(shape.id);
                layer.invalidate(true);
                openShapeContextMenu(event);
                return Promise.resolve(true);
            }
        }

        // Check if any other shapes are under the mouse
        const shapes = layer.getShapes({ includeComposites: false, onlyInView: true });
        for (let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i];
            if (shape?.contains(globalMouse) === true) {
                selectedSystem.set(shape.id);
                layer.invalidate(true);
                openShapeContextMenu(event);
                return Promise.resolve(true);
            }
        }
        // Fallback to default context menu
        openDefaultContextMenu(event);
        return Promise.resolve(true);
    }

    onKeyDown(event: KeyboardEvent, features: ToolFeatures): Promise<void> {
        if (event.defaultPrevented) return super.onKeyDown(event, features);
        if (this.active.value) {
            if (event.key === "c") {
                event.preventDefault();
                this.selectionCollapsed = true;
                collapseSelection();
            }
        }
        return super.onKeyDown(event, features);
    }

    async onKeyUp(event: KeyboardEvent, features: ToolFeatures): Promise<void> {
        if (event.defaultPrevented) return;
        if (this.active.value) {
            if (event.key === " ") {
                event.preventDefault();
            } else if (event.key === "c") {
                event.preventDefault();
                this.selectionCollapsed = false;

                const shapes: IShape[] = [];
                await expandSelection(shapes);
                sendShapePositionUpdate(shapes, false);
            }
        }
        await super.onKeyUp(event, features);
    }

    // ROTATION

    createRotationUi(features: ToolFeatures<SelectFeatures>): void {
        const layer = floorState.currentLayer.value!;

        const layerSelection = this.currentSelection;

        if (layerSelection.length === 0 || this.rotationUiActive || !this.hasFeature(SelectFeatures.Rotate, features))
            return;

        let bbox: BoundingRect;
        if (layerSelection.length === 1) {
            bbox = layerSelection[0]!.getBoundingBox();
        } else {
            bbox = layerSelection
                .map((s) => s.getAABB())
                .reduce((acc: BoundingRect, val: BoundingRect) => acc.union(val))
                .expand(new Vector(-50, -50));
        }

        const topCenter = toGP((bbox.topRight.x + bbox.topLeft.x) / 2, bbox.topLeft.y);
        const topCenterPlus = addP(topCenter, new Vector(0, -Math.max(DEFAULT_GRID_SIZE, l2gz(DEFAULT_GRID_SIZE / 2))));

        this.angle = 0;
        this.rotationAnchor = new Line(
            topCenter,
            topCenterPlus,
            {
                lineWidth: l2gz(1.5),
                isSnappable: false,
            },
            { strokeColour: ["#7c253e"] },
        );
        this.rotationBox = new Rect(
            bbox.topLeft,
            bbox.w,
            bbox.h,
            {
                isSnappable: false,
            },
            { fillColour: "rgba(0,0,0,0)", strokeColour: ["#7c253e"] },
        );
        this.rotationBox.strokeWidth = 1.5;
        this.rotationEnd = new Circle(
            topCenterPlus,
            l2gz(4),
            {
                isSnappable: false,
            },
            { fillColour: "#7c253e", strokeColour: ["rgba(0,0,0,0)"] },
        );

        for (const rotationShape of [this.rotationAnchor, this.rotationBox, this.rotationEnd]) {
            accessSystem.addAccess(
                rotationShape.id,
                playerSystem.getCurrentPlayer()!.name,
                { edit: true, movement: true, vision: true },
                NO_SYNC,
            );
            layer.addShape(rotationShape, SyncMode.NO_SYNC, InvalidationMode.NO);
        }

        if (layerSelection.length === 1) {
            const angle = layerSelection[0]!.angle;
            this.angle = angle;
            this.rotationBox.angle = angle;
            this.rotationAnchor.rotateAround(bbox.center, angle);
            this.rotationEnd.rotateAround(bbox.center, angle);
        }

        this.rotationUiActive = true;
        layer.invalidate(true);
    }

    removeRotationUi(): void {
        if (this.rotationUiActive) {
            const layer = this.rotationAnchor!.layer;
            if (layer === undefined) return;

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
        const layer = floorState.currentLayer.value!;
        const dA = newAngle - this.angle;
        this.angle = newAngle;
        const layerSelection = selectedSystem.get({ includeComposites: false });

        rotateShapes(layerSelection, dA, center, temporary);

        this.rotationEnd!.rotateAround(center, dA);
        this.rotationAnchor!.rotateAround(center, dA);
        this.rotationBox!.angle = this.angle;
        layer.invalidate(false);
    }

    // POLYGON EDIT

    createPolygonEditUi(): void {
        const selection = selectedSystem.get({ includeComposites: false });
        if (selection.length !== 1 || selection[0]!.type !== "polygon") return;

        this.removePolygonEditUi();

        this.polygonTracer = new Circle(
            toGP(0, 0),
            3,
            {
                isSnappable: false,
            },
            { fillColour: "rgba(0,0,0,0)", strokeColour: ["black"] },
        );
        this.polygonTracer.options.skipDraw = true;
        const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw)!;
        drawLayer.addShape(this.polygonTracer, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        this.updatePolygonEditUi(this.lastMousePosition);
        drawLayer.invalidate(true);
    }

    removePolygonEditUi(): void {
        if (this.polygonTracer !== null) {
            const drawLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Draw)!;
            drawLayer.removeShape(this.polygonTracer, {
                sync: SyncMode.NO_SYNC,
                recalculate: false,
                dropShapeId: true,
            });
            drawLayer.invalidate(true);
            this.polygonTracer = null;
            _$.polygonUiVisible = "hidden";
        }
    }

    updatePolygonEditUi(gp: GlobalPoint): void {
        if (this.polygonTracer === null) return;
        const selection = selectedSystem.get({ includeComposites: false });
        const polygon = selection[0] as Polygon;

        const pw = g2lz(polygon.lineWidth[0]!);

        const pv = polygon.vertices.map((v) => rotateAroundPoint(v, polygon.center, polygon.angle));
        let smallest = { distance: polygon.lineWidth[0]! * 2, nearest: gp, angle: 0, point: false };
        for (let i = 1; i < pv.length; i++) {
            const prevVertex = pv[i - 1]!;
            const vertex = pv[i]!;
            // check prev-vertex
            if (getPointDistance(prevVertex, gp) < polygon.lineWidth[0]! / 1.5) {
                const vec = Vector.fromPoints(prevVertex, vertex);
                let angle;
                if (i === 1) {
                    angle = vec.deg();
                } else {
                    const between = getAngleBetween(Vector.fromPoints(prevVertex, pv[i - 2]!), vec) / 2;
                    angle = (Math.abs(between) < Math.PI / 2 ? 1 : -1) * 90 - toDegrees(-vec.angle() + between);
                }
                smallest = { distance: 0, nearest: prevVertex, point: true, angle };
                break;
            }
            // check edge
            const info = getDistanceToSegment(gp, [prevVertex, vertex]);
            if (info.distance < polygon.lineWidth[0]! / 1.5 && info.distance < smallest.distance) {
                smallest = { ...info, angle: Vector.fromPoints(prevVertex, vertex).deg(), point: false };
            }
        }
        //check last vertex
        if (getPointDistance(pv.at(-1)!, gp) < polygon.lineWidth[0]! / 2) {
            smallest = { distance: 0, nearest: pv.at(-1)!, point: true, angle: smallest.angle };
        }
        // Show the UI
        if (smallest.distance <= polygon.lineWidth[0]!) {
            _$.polygonUiVisible = "visible";
            this.polygonTracer.refPoint = smallest.nearest;
            this.polygonTracer.options.skipDraw = false;
            this.polygonTracer.layer?.invalidate(true);
            const lp = g2l(smallest.nearest);
            const radians = toRadians(smallest.angle);
            _$.polygonUiLeft = `${lp.x - 25}px`;
            _$.polygonUiTop = `${lp.y - 25 / 2}px`;
            _$.polygonUiAngle = `${smallest.angle}deg`;
            // 12.5 + pw/2 is the exact border, additional scaling to give a bit of air
            _$.polygonUiSizeX = `${-Math.sin(radians) * (15 + (1.5 * pw) / 2)}px`;
            _$.polygonUiSizeY = `${Math.cos(radians) * (15 + (1.5 * pw) / 2)}px`;
            _$.polygonUiVertex = smallest.point;
        }
    }

    // CURSOR

    updateCursor(globalMouse: GlobalPoint, features: ToolFeatures<SelectFeatures>): void {
        let cursorStyle = "default";
        const layerSelection = selectedSystem.get({ includeComposites: false });
        for (const sel of layerSelection) {
            const resizePoint = sel.getPointIndex(globalMouse, l2gz(4));
            if (resizePoint < 0) {
                // test rotate case
                if (this.rotationUiActive) {
                    const anchor = this.rotationAnchor!.points[1];
                    if (anchor && equalPoints(anchor, toArrayP(globalMouse), 10)) {
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
