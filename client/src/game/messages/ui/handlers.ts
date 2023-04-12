import { FLAMPIE } from "../../core/flampie";
import { updateCanvasVisibility } from "../../dom/canvas";
import { uiFloorState } from "../../dom/state/floor";
import { uiGameState } from "../../dom/state/game";
import { uiSelectedState } from "../../dom/state/selected";
import { toolMap } from "../../dom/tools/tools";
import { createDomFloor } from "../../dom/worker/events/floor";
import type { DomMessages } from "../types";

// Handle messages from core to UI
export async function handleMessage(data: DomMessages): Promise<void> {
    const msg = data.msg;
    // console.debug("[UI] Handling", msg);
    if (msg === "Canvas.Visibility") {
        updateCanvasVisibility(data.options);
    } else if (msg === "Cursor.Set") {
        document.body.style.cursor = data.options;
    } else if (msg === "Floor.Create") {
        await createDomFloor(data.options);
    } else if (msg === "Floor.Index.Set") {
        uiFloorState.mutableReactive.floorIndex = data.options.index;
        uiFloorState.mutableReactive.layerIndex = data.options.layerIndex;
        uiFloorState.mutableReactive.layers = data.options.layers;
    } else if (msg === "Floors.Set") {
        uiFloorState.mutableReactive.floors = data.options;
    } else if (msg === "Game.Dm.Set") {
        uiGameState.mutableReactive.isDm = data.options;
    } else if (msg === "Layer.Index.Set") {
        uiFloorState.mutableReactive.layerIndex = data.options;
    } else if (msg === "Selected.Add") {
        for (const el of data.options) uiSelectedState.mutableReactive.selected.add(el);
    } else if (msg === "Selected.Clear") {
        uiSelectedState.mutableReactive.selected.clear();
    } else if (msg === "Selected.Remove") {
        uiSelectedState.mutableReactive.selected.delete(data.options);
    } else if (msg === "Tool.Active.Set") {
        toolMap[data.options.name].active.value = data.options.active;
    } else {
        console.warn(msg);
        FLAMPIE();
    }
}
