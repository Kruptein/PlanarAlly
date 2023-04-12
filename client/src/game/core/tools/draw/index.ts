import { l2g, clampGridLine, l2gz } from "../../../../core/conversions";
import type { GlobalPoint, LocalPoint } from "../../../../core/geometry";
import { subtractP, cloneP, toGP } from "../../../../core/geometry";
import { equalPoints } from "../../../../core/math";
import { NO_SYNC, UI_SYNC, SyncMode, InvalidationMode } from "../../../../core/models/types";
import { ctrlOrCmdPressed } from "../../../../core/utils";
import type { PressedModifiers } from "../../../common/events";
import type { DrawToolState } from "../../../common/tools/draw";
import { DrawMode, DrawShape } from "../../../common/tools/draw";
import { sendShapeSizeUpdate } from "../../api/emits/shape/core";
import type { ILayer } from "../../interfaces/layer";
import type { IShape } from "../../interfaces/shape";
import type { ICircle } from "../../interfaces/shapes/circle";
import type { IRect } from "../../interfaces/shapes/rect";
import type { Floor } from "../../models/floor";
import { LayerName } from "../../models/floor";
import { overrideLastOperation } from "../../operations/undo";
import { Circle } from "../../shapes/variants/circle";
import { Polygon } from "../../shapes/variants/polygon";
import { Rect } from "../../shapes/variants/rect";
import { Text } from "../../shapes/variants/text";
import { accessSystem } from "../../systems/access";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { doorSystem } from "../../systems/logic/door";
import { playerSystem } from "../../systems/players";
import { propertiesSystem } from "../../systems/properties";
import { getProperties } from "../../systems/properties/state";
import { locationSettingsState } from "../../systems/settings/location/state";
import { playerSettingsState } from "../../systems/settings/players/state";
import { TriangulationTarget, visionState } from "../../vision/state";

import { drawBrush } from "./brush";
import { drawPolygon } from "./polygon";
import { drawCoreState } from "./state";

interface DrawState {
    active: boolean;
    startPoint: GlobalPoint | undefined;
    shape: IShape | undefined;
    snappedToPoint: boolean;
}

const state: DrawState = {
    active: false,
    startPoint: undefined,
    shape: undefined,
    snappedToPoint: false,
};

function getLayer(data?: { floor?: Floor; layer?: LayerName }): ILayer | undefined {
    const mode = drawCoreState.ui.selectedMode;
    if (mode === DrawMode.Normal)
        return floorSystem.getLayer(data?.floor ?? floorState.readonly.currentFloor!, data?.layer);
    else if (mode === DrawMode.Erase) {
        return floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Map);
    }
    return floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Lighting);
}

async function onSelect(mouse?: { x: number; y: number }, uiState?: DrawToolState): Promise<void> {
    if (uiState !== undefined) drawCoreState.ui = uiState;

    const layer = getLayer();
    if (layer === undefined) return Promise.resolve();

    // layer.canvas.parentElement!.style.cursor = "none";
    drawBrush.create(layer, toGP(mouse?.x ?? -1000, mouse?.y ?? -1000));
    // if (getGameState().isDm) this.showLayerPoints();
}

async function onDown(lp: LocalPoint, uiState: DrawToolState, pressed: PressedModifiers | undefined): Promise<void> {
    // update worker with UI state
    drawCoreState.ui = uiState;

    const gp = l2g(lp);
    const layer = getLayer();
    if (layer === undefined) {
        console.error("Draw: Requested layer was not found!", uiState.selectedMode);
        return;
    }

    if (!drawBrush.hasBrush()) return;

    // if (!this.active.value) {
    if (!state.active) {
        state.startPoint = gp;
        state.active = true;
        //     this.active.value = true;

        createShape(gp, pressed);
        if (state.shape === undefined) return;

        if (uiState.selectedMode === DrawMode.Erase) {
            propertiesSystem.setFillColour(state.shape.id, "rgba(0, 0, 0, 1)", NO_SYNC);
        }
        if (uiState.selectedMode === DrawMode.Hide || uiState.selectedMode === DrawMode.Reveal) {
            state.shape.options.preFogShape = true;
            state.shape.options.skipDraw = true;
            propertiesSystem.setFillColour(state.shape.id, "rgba(0, 0, 0, 1)", NO_SYNC);
        }
        if (uiState.selectedMode === DrawMode.Reveal) state.shape.globalCompositeOperation = "source-over";
        else if (uiState.selectedMode === DrawMode.Hide) state.shape.globalCompositeOperation = "destination-out";
        else if (uiState.selectedMode === DrawMode.Erase) state.shape.globalCompositeOperation = "destination-out";
        accessSystem.addAccess(
            state.shape.id,
            playerSystem.getCurrentPlayer()!.name,
            { edit: true, movement: true, vision: true },
            UI_SYNC,
        );
        if (uiState.selectedMode === DrawMode.Normal) {
            if (uiState.blocksMovement) {
                propertiesSystem.setBlocksMovement(state.shape.id, true, UI_SYNC, false);
            }
            if (uiState.blocksVision) {
                propertiesSystem.setBlocksVision(state.shape.id, true, UI_SYNC, false);
            }
        }
        layer.addShape(state.shape, SyncMode.FULL_SYNC, InvalidationMode.NO);
        // Push brushhelper to back
        drawBrush.pushBack(layer);
    } else if (
        state.shape !== undefined &&
        uiState.selectedShape === DrawShape.Polygon &&
        state.shape instanceof Polygon
    ) {
        // draw tool already active in polygon mode, add a new point to the polygon
        if (pressed && playerSettingsState.useSnapping(pressed?.alt) && !state.snappedToPoint)
            drawBrush.setPosition(toGP(clampGridLine(gp.x), clampGridLine(gp.y)));
        state.shape.pushPoint(drawBrush.getPosition());
    }
    // Start a ruler in polygon mode from the last point
    if (state.shape !== undefined && uiState.selectedShape === DrawShape.Polygon && state.shape instanceof Polygon) {
        drawPolygon.onDown(state.shape, layer);
    }
    // Finalize the text shape
    if (state.shape !== undefined && uiState.selectedShape === DrawShape.Text) {
        await finaliseShape();
    }
}

function onMove(lp: LocalPoint, pressed: PressedModifiers | undefined): void {
    const gp = l2g(lp);

    const layer = getLayer();
    if (layer === undefined) {
        console.log("No active layer!");
        return;
    }

    // if (pressed && playerSettingsState.useSnapping(pressed.alt))
    //     [endPoint, state.snappedToPoint] = snapToPoint(layer, endPoint, this.ruler?.refPoint);
    // else state.snappedToPoint = false;

    if (drawBrush.hasBrush()) {
        drawBrush.onMove(gp);
    }

    if (!state.active || state.startPoint === undefined || state.shape === undefined) return;
    // if (!this.active.value || this.startPoint === undefined || state.shape === undefined) return;

    switch (drawCoreState.ui.selectedShape) {
        case DrawShape.Square: {
            const rect = state.shape as IRect;
            const newW = Math.abs(gp.x - state.startPoint.x);
            const newH = Math.abs(gp.y - state.startPoint.y);
            if (newW === rect.w && newH === rect.h) return;
            rect.w = newW;
            rect.h = newH;
            if (gp.x < state.startPoint.x || gp.y < state.startPoint.y) {
                state.shape.refPoint = toGP(Math.min(state.startPoint.x, gp.x), Math.min(state.startPoint.y, gp.y));
            }
            break;
        }
        case DrawShape.Circle: {
            const circ = state.shape as ICircle;
            const newR = Math.abs(subtractP(gp, state.startPoint).length());
            if (circ.r === newR) return;
            circ.r = newR;
            break;
        }
        case DrawShape.Brush: {
            const br = state.shape as Polygon;
            const points = br.points; // expensive call
            if (equalPoints(points.at(-1)!, [gp.x, gp.y])) return;
            br.pushPoint(gp);
            break;
        }
        case DrawShape.Polygon: {
            // this.ruler!.gp = gp;
            break;
        }
    }

    if (drawCoreState.ui.selectedShape !== DrawShape.Polygon) {
        const props = getProperties(state.shape.id)!;
        if (!state.shape.preventSync) sendShapeSizeUpdate({ shape: state.shape, temporary: true });
        if (props.blocksVision) {
            if (state.shape.floorId !== undefined) {
                const vertices = visionState
                    .getCDT(TriangulationTarget.VISION, state.shape.floorId)
                    .tds.getTriagVertices(state.shape.id);
                if (vertices.length > 1) {
                    visionState.deleteFromTriangulation({
                        target: TriangulationTarget.VISION,
                        shape: state.shape.id,
                    });
                }
                visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: state.shape.id });
                visionState.recalculateVision(state.shape.floorId);
            }
        }
    }
    layer.invalidate(false);
}

async function onUp(lp: LocalPoint, pressed: PressedModifiers | undefined): Promise<void> {
    if (
        !state.active ||
        state.shape === undefined ||
        (state.shape instanceof Polygon && drawCoreState.ui.selectedShape === DrawShape.Polygon)
    ) {
        return;
    }
    const endPoint = l2g(lp);
    // if (pressed && playerSettingsState.useSnapping(pressed.alt))
    //     [endPoint, state.snappedToPoint] = snapToPoint(this.getLayer()!, endPoint, this.ruler?.refPoint);
    // else state.snappedToPoint = false;
    // TODO: handle touch event different than altKey, long press
    if (
        pressed &&
        playerSettingsState.useSnapping(pressed.alt) &&
        locationSettingsState.raw.useGrid.value &&
        !state.snappedToPoint
    ) {
        const props = getProperties(state.shape.id)!;
        if (props.blocksVision)
            visionState.deleteFromTriangulation({
                target: TriangulationTarget.VISION,
                shape: state.shape.id,
            });
        state.shape.resizeToGrid(state.shape.getPointIndex(endPoint, l2gz(5)), ctrlOrCmdPressed(pressed));
        if (props.blocksVision) {
            visionState.addToTriangulation({ target: TriangulationTarget.VISION, shape: state.shape.id });
            if (state.shape.floorId !== undefined) visionState.recalculateVision(state.shape.floorId);
        }
        if (props.blocksMovement) {
            visionState.addToTriangulation({ target: TriangulationTarget.MOVEMENT, shape: state.shape.id });
            if (state.shape.floorId !== undefined) visionState.recalculateMovement(state.shape.floorId);
        }
    }
    await finaliseShape();
}

async function finaliseShape(): Promise<void> {
    if (state.shape === undefined) return;
    if (state.shape.points.length <= 1) {
        let mouse: { x: number; y: number } | undefined = undefined;
        if (drawBrush.hasBrush()) {
            const brushPos = drawBrush.getPosition();
            mouse = { x: brushPos.x, y: brushPos.y };
        }
        // onDeselect();
        await onSelect(mouse);
    } else {
        state.shape.updateLayerPoints();
        const props = getProperties(state.shape.id)!;

        if (state.shape.floorId !== undefined) {
            if (props.blocksVision) visionState.recalculateVision(state.shape.floorId);
            if (props.blocksMovement) visionState.recalculateMovement(state.shape.floorId);
        }
        if (!state.shape.preventSync) sendShapeSizeUpdate({ shape: state.shape, temporary: false });
        if (drawCoreState.ui.isDoor) {
            doorSystem.inform(
                state.shape.id,
                true,
                {
                    permissions: drawCoreState.ui.doorPermissions,
                    toggleMode: drawCoreState.ui.toggleMode,
                },
                true,
            );
        }
        overrideLastOperation({ type: "shapeadd", shapes: [state.shape.asDict()] });
    }
    state.active = false;
    // this.active.value = false;
    getLayer()?.invalidate(false);
}

function createShape(gp: GlobalPoint, pressed: PressedModifiers | undefined): void {
    switch (drawCoreState.ui.selectedShape) {
        case DrawShape.Square: {
            state.shape = new Rect(cloneP(gp), 0, 0, undefined, {
                fillColour: drawCoreState.ui.fillColour,
                strokeColour: [drawCoreState.ui.borderColour],
            });
            break;
        }
        case DrawShape.Circle: {
            state.shape = new Circle(cloneP(gp), drawCoreState.helperSize(), undefined, {
                fillColour: drawCoreState.ui.fillColour,
                strokeColour: [drawCoreState.ui.borderColour],
            });
            break;
        }
        case DrawShape.Brush: {
            state.shape = new Polygon(
                cloneP(gp),
                [],
                { openPolygon: true, lineWidth: [drawCoreState.ui.brushSize] },
                {
                    strokeColour: [drawCoreState.ui.fillColour],
                },
            );
            propertiesSystem.setFillColour(state.shape.id, drawCoreState.ui.fillColour, NO_SYNC);
            break;
        }
        case DrawShape.Polygon: {
            const stroke = drawCoreState.ui.isClosedPolygon
                ? drawCoreState.ui.borderColour
                : drawCoreState.ui.fillColour;
            if (pressed && playerSettingsState.useSnapping(pressed.alt) && !state.snappedToPoint) {
                drawBrush.setPosition(toGP(clampGridLine(gp.x), clampGridLine(gp.y)));
            }
            state.shape = new Polygon(
                drawBrush.getPosition(),
                [],
                { lineWidth: [drawCoreState.ui.brushSize], openPolygon: !drawCoreState.ui.isClosedPolygon },
                {
                    fillColour: drawCoreState.ui.fillColour, // is ignored for open polygons
                    strokeColour: [stroke],
                },
            );
            break;
        }
        case DrawShape.Text: {
            const text = "?";
            // const text = await this.promptFunction!("What should the text say?", "New text");
            // if (text === undefined) {
            //     this.active.value = false;
            //     return;
            // }
            state.shape = new Text(drawBrush.getPosition(), text, drawCoreState.ui.fontSize, undefined, {
                fillColour: drawCoreState.ui.fillColour,
                strokeColour: [drawCoreState.ui.borderColour],
            });
            break;
        }
        default:
            return;
    }
}

export const drawCoreTool = { onDown, onMove, onUp, onSelect };
