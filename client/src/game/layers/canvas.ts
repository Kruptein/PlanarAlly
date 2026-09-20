import { renderingState } from "../rendering/state";

export function createCanvas(layerName?: string): HTMLCanvasElement {
    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.style.display = "none";
    if (layerName !== undefined) canvas.classList.add(layerName);
    updateCanvasDimensions(canvas);
    return canvas;
}

export function updateCanvasDimensions(canvas: HTMLCanvasElement): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Set display size in css pixels
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    updateCanvasPixelRatio(canvas);
}

export function updateCanvasPixelRatio(canvas: HTMLCanvasElement): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = renderingState.pixelRatio.value;
    // Set actual size in memory
    canvas.width = Math.floor(pixelRatio * width);
    canvas.height = Math.floor(pixelRatio * height);
    // Normalize coordinate system to use css pixels
    canvas.getContext("2d")?.scale(pixelRatio, pixelRatio);
}
