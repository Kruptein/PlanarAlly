import { coreStore } from "../../../store/core";
import { FLOEMPIE } from "../../core/floempie";
import { addServerLayer, completeServerFloor } from "../../core/floor/server";
import { startGame, stopGame } from "../../core/game";
import { keyboardPan } from "../../core/input/keyboard/down";
import { floorSystem } from "../../core/systems/floors";
import { floorState } from "../../core/systems/floors/state";
import { selectedSystem } from "../../core/systems/selected";
import { mousePan } from "../../core/tools/pan";
import { rulerCoreTool } from "../../core/tools/ruler";
import { selectCoreTool } from "../../core/tools/select";
import { selectRotation } from "../../core/tools/select/rotation";
import type { WorkerMessages } from "../types";

// Handle messages from UI to core
export async function handleMessage(data: WorkerMessages): Promise<void> {
    const msg = data.msg;
    console.debug("[WORKER] Handling", msg);
    if (msg === "Floor.Background.Set") {
        const { id, background } = data.options;
        floorSystem.setFloorBackground({ id }, background, true);
    } else if (msg === "Floor.Change") {
        floorSystem.changeFloor(data.options.targetFloor, data.options.altPressed, data.options.shiftPressed);
    } else if (msg === "Floor.Complete") {
        completeServerFloor(data.options);
    } else if (msg === "Floor.Rename") {
        const { index, name } = data.options;
        floorSystem.renameFloor(index, name, true);
    } else if (msg === "Floor.Select") {
        floorSystem.selectFloor({ id: data.options }, true);
    } else if (msg === "Floor.Type.Set") {
        const { index, type } = data.options;
        floorSystem.setFloorType({ index }, type, true);
    } else if (msg === "Game.Start") {
        startGame(data.options);
    } else if (msg === "Game.Stop") {
        stopGame();
    } else if (msg === "Layer.Create") {
        const { name, floorId, canvas, width, height } = data.options;
        addServerLayer(name, floorId, canvas, width, height);
    } else if (msg === "Layer.Select") {
        floorSystem.selectLayer(data.options.name);
    } else if (msg === "Keyboard.Deselect") {
        selectedSystem.clear();
        floorState.readonly.currentLayer?.invalidate(true);
    } else if (msg === "Keyboard.Pan") {
        const { code, shiftPressed } = data.options;
        await keyboardPan(code, shiftPressed);
    } else if (msg === "Tool.Pan") {
        const { origin, target, full } = data.options;
        mousePan(origin, target, full);
    } else if (msg === "Tool.Ruler.Cleanup") {
        rulerCoreTool.cleanup();
    } else if (msg === "Tool.Ruler.Down") {
        const { lp, pressed } = data.options;
        rulerCoreTool.onDown(lp, pressed);
    } else if (msg === "Tool.Ruler.Move") {
        const { lp, pressed } = data.options;
        rulerCoreTool.onMove(lp, pressed);
    } else if (msg === "Tool.Ruler.Public.Set") {
        rulerCoreTool.showPublic(data.options);
    } else if (msg === "Tool.Ruler.Split") {
        rulerCoreTool.split();
    } else if (msg === "Tool.Select.Down") {
        const { lp, features, pressed } = data.options;
        selectCoreTool.onDown(lp, features, pressed);
    } else if (msg === "Tool.Select.Move") {
        const { lp, features, pressed } = data.options;
        await selectCoreTool.onMove(lp, pressed, features);
    } else if (msg === "Tool.Select.Rotation.Ui") {
        if (data.options.show) {
            selectRotation.createUi(data.options.features);
        } else {
            selectRotation.removeUi();
        }
    } else if (msg === "Tool.Select.Up") {
        const { lp, features, pressed } = data.options;
        await selectCoreTool.onUp(lp, pressed, features);
    } else if (msg === "username") {
        coreStore.setUsername(data.options.username);
    } else {
        console.warn(msg);
        FLOEMPIE();
    }
}
