// import { playerSettingsState } from "../systems/settings/players/state";

import type { Canvas } from "../core/canvas";
import type { FloorId } from "../core/models/floor";
import { HAS_WORKER } from "../messages/supported";

const CANVAS_MAP = new Map<string, HTMLCanvasElement>();

export function createLayerCanvas(
    floorId: FloorId,
    layerName: string,
): { canvas: Canvas | undefined; width: number; height: number } {
    const name = `${floorId}-${layerName}`;
    const { domCanvas, canvas } = createCanvas(name, HAS_WORKER);
    CANVAS_MAP.set(name, domCanvas);
    domCanvas.id = name;

    // Add the element to the DOM
    const layers = document.getElementById("layers");
    if (layers === null) {
        console.warn("Layers div is missing, this will prevent the main game board from loading!");
        return { canvas, width: 0, height: 0 };
    }
    if (layerName !== "fow-players") layers.appendChild(domCanvas);

    return { canvas, width: domCanvas.width, height: domCanvas.height };
}

function createCanvas(
    layerName: string,
    createOffscreenCanvas: boolean,
): { canvas: Canvas; domCanvas: HTMLCanvasElement } {
    // Create canvas element
    const canvas = document.createElement("canvas");

    // canvas.style.display = "none";
    // if (layerName !== undefined) canvas.id =  .classList.add(layerName);
    setCanvasDimensions(canvas, window.innerWidth, window.innerHeight);

    if (createOffscreenCanvas) {
        return { canvas: canvas.transferControlToOffscreen(), domCanvas: canvas };
    } else {
        return { canvas, domCanvas: canvas };
    }
}

export function setCanvasDimensions(canvas: HTMLCanvasElement, width: number, height: number): void {
    // const pixelRatio = playerSettingsState.devicePixelRatio.value;
    const pixelRatio = 1;
    // Set display size in css pixels
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    // Set actual size in memory
    canvas.width = Math.floor(pixelRatio * width);
    canvas.height = Math.floor(pixelRatio * height);
    // Normalize coordinate system to use css pixels
    // canvas.getContext("2d")?.scale(pixelRatio, pixelRatio);
}

export function updateCanvasVisibility(data: { name: string; visible: boolean; index?: string }[]): void {
    for (const el of data) {
        const canvas = document.getElementById(el.name);
        if (canvas === null) {
            console.error(`Broken canvas links detected (${el.name})`);
        } else {
            if (el.index !== undefined) canvas.style.zIndex = el.index;
            canvas.style.visibility = el.visible ? "visible" : "hidden";
        }
    }
}
