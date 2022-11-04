import { playerSettingsState } from "../systems/settings/players/state";

export function createCanvas(layerName?: string): HTMLCanvasElement {
    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.style.display = "none";
    if (layerName !== undefined) canvas.classList.add(layerName);
    setCanvasDimensions(canvas, window.innerWidth, window.innerHeight);
    return canvas;
}

export function setCanvasDimensions(canvas: HTMLCanvasElement, width: number, height: number): void {
    const pixelRatio = playerSettingsState.devicePixelRatio.value;
    // Set display size in css pixels
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    // Set actual size in memory
    canvas.width = Math.floor(pixelRatio * width);
    canvas.height = Math.floor(pixelRatio * height);
    // Normalize coordinate system to use css pixels
    canvas.getContext("2d")?.scale(pixelRatio, pixelRatio);
}
