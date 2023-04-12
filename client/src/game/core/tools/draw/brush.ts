import type { GlobalPoint } from "../../../../core/geometry";
import { Vector, addP, toArrayP, cloneP, toGP } from "../../../../core/geometry";
import { SyncMode, InvalidationMode, NO_SYNC } from "../../../../core/models/types";
import { mostReadable } from "../../../../core/utils";
import { DrawMode } from "../../../common/tools/draw";
import type { ILayer } from "../../interfaces/layer";
import { LayerName } from "../../models/floor";
import { Circle } from "../../shapes/variants/circle";
import { Polygon } from "../../shapes/variants/polygon";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { propertiesSystem } from "../../systems/properties";

import { drawCoreState } from "./state";

interface BrushState {
    brush: Circle | undefined;
    pointer: Polygon | undefined;
}

const state: BrushState = {
    brush: undefined,
    pointer: undefined,
};

function hasBrush(): boolean {
    return state.brush !== undefined;
}

function getPosition(): GlobalPoint {
    if (state.brush === undefined) throw new Error("BrushHelper was tampered with");
    return cloneP(state.brush.refPoint);
}

function setPosition(gp: GlobalPoint): void {
    if (state.brush === undefined) return;
    state.brush.refPoint = gp;
}

function create(layer: ILayer, position: GlobalPoint, brushSize?: number): Circle {
    const size = brushSize ?? drawCoreState.ui.brushSize / 2;
    state.brush = new Circle(
        position,
        size,
        {
            strokeWidth: Math.max(1, size * 0.05),
            isSnappable: false,
        },
        { fillColour: drawCoreState.ui.fillColour, strokeColour: [mostReadable(drawCoreState.ui.fillColour)] },
    );
    // Make sure we can see the border of the reveal brush
    state.brush.options.borderOperation = "source-over";

    layer.addShape(state.brush, SyncMode.NO_SYNC, InvalidationMode.NORMAL); // during mode change the shape is already added
    setup();

    if (state.pointer === undefined) createPointer(position);

    return state.brush;
}

function createPointer(gp: GlobalPoint): void {
    const vertices = [toGP(0, 20), toGP(4.2, 12.6), toGP(12, 16)];
    const vec = Vector.fromArray(toArrayP(gp));
    state.pointer = new Polygon(
        gp,
        vertices.map((v) => addP(v, vec)),
        {
            openPolygon: false,
            isSnappable: false,
        },
        { fillColour: "white", strokeColour: ["black"] },
    );
    // Make sure we can see the border of the reveal brush
    state.pointer.options.borderOperation = "source-over";
    state.pointer.ignoreZoomSize = true;

    const drawLayer = floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Draw)!;
    drawLayer.addShape(state.pointer, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
    drawLayer.invalidate(true);
}

function pushBack(layer: ILayer): void {
    const refPoint = state.brush?.refPoint;
    const bs = state.brush?.r;
    if (state.brush !== undefined) {
        layer.removeShape(state.brush, { sync: SyncMode.NO_SYNC, recalculate: true, dropShapeId: true });
    }
    state.brush = create(layer, toGP(-1000, -1000), bs);
    if (refPoint) state.brush.refPoint = refPoint;
}

function setup(): void {
    if (state.brush === undefined) return;
    if (drawCoreState.ui.selectedMode === DrawMode.Reveal || drawCoreState.ui.selectedMode === DrawMode.Hide) {
        state.brush.options.preFogShape = true;
        state.brush.options.skipDraw = true;
        propertiesSystem.setFillColour(state.brush.id, "rgba(0, 0, 0, 1)", NO_SYNC);

        if (drawCoreState.ui.selectedMode === DrawMode.Reveal) state.brush.globalCompositeOperation = "source-over";
        else if (drawCoreState.ui.selectedMode === DrawMode.Hide)
            state.brush.globalCompositeOperation = "destination-out";
    } else {
        delete state.brush.options.preFogShape;
        delete state.brush.options.skipDraw;
        state.brush.globalCompositeOperation = "source-over";
        propertiesSystem.setFillColour(state.brush.id, drawCoreState.ui.fillColour, NO_SYNC);
    }
    state.brush.r = drawCoreState.helperSize();
}

function onMove(gp: GlobalPoint): void {
    if (state.brush === undefined) return;

    state.brush.r = drawCoreState.helperSize();
    state.brush.refPoint = gp;
    state.brush.layer?.invalidate(false);

    if (state.pointer === undefined) return;

    state.pointer.refPoint = gp;
    state.pointer.layer?.invalidate(true);
}

export const drawBrush = {
    getPosition,
    setPosition,
    hasBrush,
    create,
    pushBack,
    onMove,
};
