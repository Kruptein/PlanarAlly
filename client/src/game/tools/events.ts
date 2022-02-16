import { l2g } from "../../core/conversions";
import { floorStore } from "../../store/floor";
import { gameStore } from "../../store/game";
import { uiStore } from "../../store/ui";
import { getShape } from "../id";
import { getLocalPointFromEvent } from "../input/mouse";
import { LayerName } from "../models/floor";
import { ToolName } from "../models/tools";

import { activeTool, getActiveTool, getFeatures, toolMap } from "./tools";

export function mouseDown(event: MouseEvent): void {
    if ((event.target as HTMLElement).tagName !== "CANVAS") return;

    let targetTool = activeTool.value;
    if (event.button === 1) {
        targetTool = ToolName.Pan;
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
    // force targetTool to pan if hitting mouse wheel
    if ((event.buttons & 4) !== 0) {
        targetTool = ToolName.Pan;
    } else if ((event.button & 1) > 1) {
        return;
    }

    const tool = toolMap[targetTool];

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        await toolMap[permitted.name].onMouseMove(event, permitted.features);
    }

    await tool.onMouseMove(event, getFeatures(targetTool));

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        await toolMap[permitted.name].onMouseMove(event, permitted.features);
    }

    // HOVER code
    const eventPoint = l2g(getLocalPointFromEvent(event));
    // Annotation hover
    let foundAnnotation = false;
    for (const uuid of gameStore.state.annotations) {
        if (floorStore.hasLayer(floorStore.currentFloor.value!, LayerName.Draw)) {
            const shape = getShape(uuid);
            if (shape && shape.floor.id === floorStore.currentFloor.value!.id && shape.contains(eventPoint)) {
                foundAnnotation = true;
                uiStore.setAnnotationText(shape.annotation);
            }
        }
    }
    if (!foundAnnotation && uiStore.state.annotationText.length > 0) {
        uiStore.setAnnotationText("");
    }
}

export async function mouseUp(event: MouseEvent): Promise<void> {
    if ((event.target as HTMLElement).tagName !== "CANVAS") return;

    let targetTool = activeTool.value;
    if (event.button === 1) {
        targetTool = ToolName.Pan;
    } else if (event.button !== 0) {
        return;
    }

    const tool = toolMap[targetTool];

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        await toolMap[permitted.name].onMouseUp(event, permitted.features);
    }

    await tool.onMouseUp(event, getFeatures(targetTool));

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        await toolMap[permitted.name].onMouseUp(event, permitted.features);
    }
}

export async function mouseLeave(event: MouseEvent): Promise<void> {
    const tool = getActiveTool();

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        await toolMap[permitted.name].onMouseUp(event, permitted.features);
    }

    await tool.onMouseUp(event, getFeatures(activeTool.value));

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        await toolMap[permitted.name].onMouseUp(event, permitted.features);
    }
}

export function contextMenu(event: MouseEvent): void {
    if ((event.target as HTMLElement).tagName !== "CANVAS") return;
    if (event.button !== 2 || (event.target as HTMLElement).tagName !== "CANVAS") return;
    const tool = getActiveTool();

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        toolMap[permitted.name].onContextMenu(event, permitted.features);
    }

    tool.onContextMenu(event, getFeatures(activeTool.value));

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        toolMap[permitted.name].onContextMenu(event, permitted.features);
    }
}

export function keyUp(event: KeyboardEvent): void {
    const tool = getActiveTool();

    for (const permitted of tool.permittedTools) {
        if (!(permitted.early ?? false)) continue;
        toolMap[permitted.name].onKeyUp(event, permitted.features);
    }

    tool.onKeyUp(event, getFeatures(activeTool.value));

    for (const permitted of tool.permittedTools) {
        if (permitted.early ?? false) continue;
        toolMap[permitted.name].onKeyUp(event, permitted.features);
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
        else await otherTool.onTouchMove(event, permitted.features);
    }

    // Annotation hover
    let found = false;
    for (const uuid of gameStore.state.annotations) {
        if (floorStore.hasLayer(floorStore.currentFloor.value!, LayerName.Draw)) {
            const shape = getShape(uuid);
            if (
                shape &&
                shape.floor.id === floorStore.currentFloor.value!.id &&
                shape.contains(l2g(getLocalPointFromEvent(event)))
            ) {
                found = true;
                uiStore.setAnnotationText(shape.annotation);
            }
        }
    }
    if (!found && uiStore.state.annotationText.length > 0) {
        uiStore.setAnnotationText("");
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
