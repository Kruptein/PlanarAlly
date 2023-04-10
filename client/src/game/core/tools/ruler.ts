import { l2g } from "../../../core/conversions";
import type { GlobalPoint, LocalPoint } from "../../../core/geometry";
import { toGP, cloneP } from "../../../core/geometry";
import { snapToGridPoint } from "../../../core/math";
import { InvalidationMode, NO_SYNC, SyncMode } from "../../../core/models/types";
import { i18n } from "../../../i18n";
import type { PressedModifiers } from "../../common/events";
import { postUi } from "../../messages/ui";
import { sendShapePositionUpdate } from "../api/emits/shape/core";
import { LayerName } from "../models/floor";
import { ToolName } from "../models/tools";
import { Line } from "../shapes/variants/line";
import { Text } from "../shapes/variants/text";
import { accessSystem } from "../systems/access";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { playerSystem } from "../systems/players";
import { DEFAULT_GRID_SIZE } from "../systems/position/state";
import { locationSettingsState } from "../systems/settings/location/state";
import { playerSettingsState } from "../systems/settings/players/state";

interface RulerState {
    active: boolean;
    syncMode: SyncMode;
    startPoint: GlobalPoint | undefined;
    rulers: Line[];
    text: Text | undefined;
    currentLength: number;
    previousLength: number;
}

const state: RulerState = {
    active: false,
    syncMode: SyncMode.NO_SYNC,
    startPoint: undefined,
    rulers: [],
    text: undefined,
    currentLength: 0,
    previousLength: 0,
};

function setActive(active: boolean): void {
    state.active = active;
    postUi("Tool.Active.Set", { name: ToolName.Ruler, active });
}

function showPublic(show: boolean): void {
    state.syncMode = show ? SyncMode.TEMP_SYNC : SyncMode.NO_SYNC;
}

function createNewRuler(start: GlobalPoint, end: GlobalPoint): void {
    const ruler = new Line(
        start,
        end,
        {
            lineWidth: 5,
            isSnappable: false,
        },
        { strokeColour: [playerSettingsState.raw.rulerColour.value] },
    );
    ruler.ignoreZoomSize = true;

    accessSystem.addAccess(
        ruler.id,
        playerSystem.getCurrentPlayer()!.name,
        { edit: true, movement: true, vision: true },
        NO_SYNC,
    );

    const layer = floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Draw);
    layer?.addShape(ruler, state.syncMode, InvalidationMode.NORMAL);

    state.rulers.push(ruler);
}

function onDown(lp: LocalPoint, pressed: PressedModifiers | undefined): void {
    // Cleanup in normal cases is not needed onDown as the state should auto clean onUp.
    // There are however numerous edgecases where the onUp is never caught
    // So we want to make sure we're starting clean
    cleanup();
    setActive(true);

    state.startPoint = l2g(lp);
    if (pressed && playerSettingsState.useSnapping(pressed.alt)) {
        [state.startPoint] = snapToGridPoint(state.startPoint);
    }

    createNewRuler(cloneP(state.startPoint), cloneP(state.startPoint));

    state.text = new Text(
        cloneP(state.startPoint),
        "",
        20,
        {
            isSnappable: false,
        },
        { fillColour: "#000", strokeColour: ["#fff"] },
    );
    state.text.ignoreZoomSize = true;

    accessSystem.addAccess(
        state.text.id,
        playerSystem.getCurrentPlayer()!.name,
        { edit: true, movement: true, vision: true },
        NO_SYNC,
    );

    const layer = floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Draw);
    layer?.addShape(state.text, state.syncMode, InvalidationMode.NORMAL);
}

function onMove(lp: LocalPoint, pressed: PressedModifiers | undefined): void {
    let endPoint = l2g(lp);
    if (!state.active) return;

    if (pressed && playerSettingsState.useSnapping(pressed.alt)) [endPoint] = snapToGridPoint(endPoint);

    const ruler = state.rulers.at(-1)!;
    ruler.endPoint = endPoint;
    sendShapePositionUpdate([ruler], true);

    const start = ruler.refPoint;
    const end = ruler.endPoint;

    const diffsign = Math.sign(end.x - start.x) * Math.sign(end.y - start.y);
    const xdiff = Math.abs(end.x - start.x);
    const ydiff = Math.abs(end.y - start.y);
    let distance = (Math.sqrt(xdiff ** 2 + ydiff ** 2) * locationSettingsState.raw.unitSize.value) / DEFAULT_GRID_SIZE;
    state.currentLength = distance;
    distance += state.previousLength;

    // round to 1 decimal
    const label = i18n.global.n(Math.round(10 * distance) / 10) + " " + locationSettingsState.raw.unitSizeUnit.value;
    const angle = Math.atan2(diffsign * ydiff, xdiff);
    const xmid = Math.min(start.x, end.x) + xdiff / 2;
    const ymid = Math.min(start.y, end.y) + ydiff / 2;
    state.text!.refPoint = toGP(xmid, ymid);
    state.text!.setText(label, SyncMode.TEMP_SYNC);
    state.text!.angle = angle;
    sendShapePositionUpdate([state.text!], true);

    const layer = floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Draw);
    layer?.invalidate(true);
}

function split(): void {
    const lastRuler = state.rulers.at(-1)!;
    createNewRuler(lastRuler.endPoint, lastRuler.endPoint);
    state.previousLength += state.currentLength;

    const layer = floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Draw);
    layer?.moveShapeOrder(state.text!, layer.size({ includeComposites: true }) - 1, SyncMode.TEMP_SYNC);
}

function cleanup(): void {
    if (!state.active) return;

    const layer = floorSystem.getLayer(floorState.readonly.currentFloor!, LayerName.Draw);
    if (layer === undefined) {
        console.log("No active layer!");
        return;
    }

    setActive(false);
    for (const ruler of state.rulers) {
        layer.removeShape(ruler, { sync: state.syncMode, recalculate: true, dropShapeId: true });
    }
    layer.removeShape(state.text!, { sync: state.syncMode, recalculate: true, dropShapeId: true });
    state.startPoint = state.text = undefined;
    state.rulers = [];
    state.previousLength = 0;
}

export const rulerCoreTool = {
    onDown,
    onMove,
    cleanup,
    split,
    showPublic,
};
