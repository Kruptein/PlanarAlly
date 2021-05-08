export function createCanvas(): HTMLCanvasElement {
    // Create canvas element
    const canvas = document.createElement("canvas");
    setCanvasDimensions(canvas, window.innerWidth, window.innerHeight);
    return canvas;
}

export function setCanvasDimensions(canvas: HTMLCanvasElement, width: number, height: number): void {
    // Set display size in css pixels
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    // Set actual size in memory
    canvas.width = Math.floor(window.devicePixelRatio * width);
    canvas.height = Math.floor(window.devicePixelRatio * height);
    // Normalize coordinate system to use css pixels
    canvas.getContext("2d")?.scale(window.devicePixelRatio, window.devicePixelRatio);
}
