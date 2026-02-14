import { l2g } from "../../core/conversions";
import { getShape } from "../id";
import { getLocalPointFromEvent } from "../input/mouse";
import { LayerName } from "../models/floor";
import { ToolName } from "../models/tools";
import { floorSystem } from "../systems/floors";
import { floorState } from "../systems/floors/state";
import { noteState } from "../systems/notes/state";
import { playerSettingsState } from "../systems/settings/players/state";
import { uiSystem } from "../systems/ui";
import { uiState } from "../systems/ui/state";

import { activeTool, getActiveTool, getFeatures, toolMap } from "./tools";

function isPanModeButton(button: number): boolean {
    const mode = playerSettingsState.raw.mousePanMode.value;
    if (mode === 3) return [1, 2].includes(button);
    else if (mode === 0) return false;
    return button === mode;
}

function isPanModeButtons(buttons: number): boolean {
    const mode = playerSettingsState.raw.mousePanMode.value;
    const middle = (buttons & 4) !== 0;
    const right = (buttons & 2) !== 0;
    if (mode === 3) return middle || right;
    else if (mode === 2) return right;
    else if (mode === 1) return middle;
    return false;
}

export function mouseDown(event: MouseEvent): void {
    if ((event.target as HTMLElement).tagName !== "CANVAS") return;

    let targetTool = activeTool.value;
    if (isPanModeButton(event.button)) {
        toolMap[targetTool].onPanStart();
        targetTool = ToolName.Pan;
        if (event.button === 2) uiSystem.preventContextMenu(false);
    } else if (event.button !== 0) {
        return;
    }

    const tool = toolMap[targetTool];

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        toolMap[permitted.name].onMouseDown(event, permitted.features);
    }

    tool.onMouseDown(event, getFeatures(targetTool));

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        toolMap[permitted.name].onMouseDown(event, permitted.features);
    }
}

export async function mouseMove(event: MouseEvent): Promise<void> {
    if ((event.target as HTMLElement).tagName !== "CANVAS") return;

    let targetTool = activeTool.value;
    // if ((event.buttons & 4) !== 0 || (event.buttons & 2) !== 0) {
    if (isPanModeButtons(event.buttons)) {
        targetTool = ToolName.Pan;
        if ((event.buttons & 2) !== 0) uiSystem.preventContextMenu(true);
    } else if ((event.button & 1) > 1) {
        return;
    }

    const tool = toolMap[targetTool];

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        // oxlint-disable-next-line no-await-in-loop
        await toolMap[permitted.name].onMouseMove(event, permitted.features);
    }

    await tool.onMouseMove(event, getFeatures(targetTool));

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        // oxlint-disable-next-line no-await-in-loop
        await toolMap[permitted.name].onMouseMove(event, permitted.features);
    }

    // HOVER code
    const eventPoint = l2g(getLocalPointFromEvent(event));
    // Annotation hover
    let foundAnnotation = false;
    if (floorSystem.hasLayer(floorState.currentFloor.value!, LayerName.Draw)) {
        for (const [shapeId, notes] of noteState.raw.shapeNotes.entries1()) {
            const shape = getShape(shapeId);
            if (shape && shape.floorId === floorState.currentFloor.value!.id && shape.contains(eventPoint)) {
                for (const noteId of notes) {
                    const note = noteState.raw.notes.get(noteId);
                    if (note?.showOnHover === true) {
                        foundAnnotation = true;
                        uiSystem.setAnnotationText(note.text);
                        break;
                    }
                }
                if (foundAnnotation) break;
            }
        }
    }
    if (!foundAnnotation && uiState.raw.annotationText.length > 0) {
        uiSystem.setAnnotationText("");
    }
}

export async function mouseUp(event: MouseEvent): Promise<void> {
    if ((event.target as HTMLElement).tagName !== "CANVAS") return;

    let targetTool = activeTool.value;
    if (isPanModeButton(event.button)) {
        if (event.button === 2) {
            if (!uiState.raw.preventContextMenu) {
                return contextMenu(event);
            }
        }
        toolMap[targetTool].onPanEnd();
        targetTool = ToolName.Pan;
    } else if (event.button === 2) {
        uiSystem.preventContextMenu(false);
        return contextMenu(event);
    } else if (event.button !== 0) {
        return;
    }

    const tool = toolMap[targetTool];

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        // oxlint-disable-next-line no-await-in-loop
        await toolMap[permitted.name].onMouseUp(event, permitted.features);
    }

    await tool.onMouseUp(event, getFeatures(targetTool));

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        // oxlint-disable-next-line no-await-in-loop
        await toolMap[permitted.name].onMouseUp(event, permitted.features);
    }
}

export async function mouseLeave(event: MouseEvent): Promise<void> {
    const tool = getActiveTool();

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        // oxlint-disable-next-line no-await-in-loop
        await toolMap[permitted.name].onMouseUp(event, permitted.features);
    }

    await tool.onMouseUp(event, getFeatures(activeTool.value));

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        // oxlint-disable-next-line no-await-in-loop
        await toolMap[permitted.name].onMouseUp(event, permitted.features);
    }
}

async function contextMenu(event: MouseEvent): Promise<void> {
    if ((event.target as HTMLElement).tagName !== "CANVAS") return;
    if (uiState.raw.preventContextMenu) return;
    if (event.button !== 2) return;
    const tool = getActiveTool();

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        // oxlint-disable-next-line no-await-in-loop
        await toolMap[permitted.name].onContextMenu(event, permitted.features);
    }

    const done = !(await tool.onContextMenu(event, getFeatures(activeTool.value)));
    if (done) return;

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        // oxlint-disable-next-line no-await-in-loop
        await toolMap[permitted.name].onContextMenu(event, permitted.features);
    }
}

export async function keyDown(event: KeyboardEvent): Promise<void> {
    const tool = getActiveTool();

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        // oxlint-disable-next-line no-await-in-loop
        await toolMap[permitted.name].onKeyDown(event, permitted.features);
    }

    await tool.onKeyDown(event, getFeatures(activeTool.value));

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        // oxlint-disable-next-line no-await-in-loop
        await toolMap[permitted.name].onKeyDown(event, permitted.features);
    }
}

export async function keyUp(event: KeyboardEvent): Promise<void> {
    const tool = getActiveTool();

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        // oxlint-disable-next-line no-await-in-loop
        await toolMap[permitted.name].onKeyUp(event, permitted.features);
    }

    await tool.onKeyUp(event, getFeatures(activeTool.value));

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        // oxlint-disable-next-line no-await-in-loop
        await toolMap[permitted.name].onKeyUp(event, permitted.features);
    }
}

export function touchStart(event: TouchEvent): void {
    if ((event.target as HTMLElement).tagName !== "CANVAS") return;

    const tool = getActiveTool();

    if (event.touches.length === 2) {
        tool.scaling = true;
    }

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        const permittedTool = toolMap[permitted.name];
        permittedTool.scaling = tool.scaling;
        if (permittedTool.scaling) permittedTool.onPinchStart(event, permitted.features);
        else permittedTool.onTouchStart(event, permitted.features);
    }

    tool.onTouchStart(event, getFeatures(activeTool.value));

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        const permittedTool = toolMap[permitted.name];
        permittedTool.scaling = tool.scaling;
        if (permittedTool.scaling) permittedTool.onPinchStart(event, permitted.features);
        else permittedTool.onTouchStart(event, permitted.features);
    }
}

export async function touchMove(event: TouchEvent): Promise<void> {
    if ((event.target as HTMLElement).tagName !== "CANVAS") return;

    const tool = getActiveTool();

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        const otherTool = toolMap[permitted.name];
        if (otherTool.scaling) otherTool.onPinchMove(event, permitted.features);
        else if (event.touches.length >= 3) otherTool.onThreeTouchMove(event, permitted.features);
        // oxlint-disable-next-line no-await-in-loop
        else await otherTool.onTouchMove(event, permitted.features);
    }

    if (tool.scaling) {
        event.preventDefault();
        tool.onPinchMove(event, getFeatures(activeTool.value));
    } else if (event.touches.length >= 3) {
        tool.onThreeTouchMove(event, getFeatures(activeTool.value));
    } else {
        await tool.onTouchMove(event, getFeatures(activeTool.value));
    }

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        const otherTool = toolMap[permitted.name];
        if (otherTool.scaling) otherTool.onPinchMove(event, permitted.features);
        else if (event.touches.length >= 3) otherTool.onThreeTouchMove(event, permitted.features);
        // oxlint-disable-next-line no-await-in-loop
        else await otherTool.onTouchMove(event, permitted.features);
    }

    // Annotation hover
    let found = false;
    if (floorSystem.hasLayer(floorState.currentFloor.value!, LayerName.Draw)) {
        for (const [shapeId, notes] of noteState.raw.shapeNotes.entries1()) {
            const shape = getShape(shapeId);
            if (
                shape &&
                shape.floorId === floorState.currentFloor.value!.id &&
                shape.contains(l2g(getLocalPointFromEvent(event)))
            ) {
                for (const noteId of notes) {
                    const note = noteState.raw.notes.get(noteId);
                    if (note?.showOnHover === true) {
                        found = true;
                        uiSystem.setAnnotationText(note.text);
                        break;
                    }
                }
                if (found) break;
            }
        }
    }
    if (!found && uiState.raw.annotationText.length > 0) {
        uiSystem.setAnnotationText("");
    }
}

export function touchEnd(event: TouchEvent): void {
    if ((event.target as HTMLElement).tagName !== "CANVAS") return;

    const tool = getActiveTool();

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        const otherTool = toolMap[permitted.name];
        if (otherTool.scaling) otherTool.onPinchEnd(event, permitted.features);
        else otherTool.onTouchEnd(event, permitted.features);
        otherTool.scaling = false;
    }

    if (tool.scaling) tool.onPinchEnd(event, getFeatures(activeTool.value));
    else tool.onTouchEnd(event, getFeatures(activeTool.value));
    tool.scaling = false;

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        const otherTool = toolMap[permitted.name];
        if (otherTool.scaling) otherTool.onPinchEnd(event, permitted.features);
        else otherTool.onTouchEnd(event, permitted.features);
        otherTool.scaling = false;
    }
}
