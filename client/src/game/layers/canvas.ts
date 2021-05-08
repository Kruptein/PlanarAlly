export function createCanvas(): HTMLCanvasElement {
    // Create canvas element
    const canvas = document.createElement("canvas");
    // Set display size in css pixels
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    // Set actual size in memory
    canvas.width = Math.floor(window.devicePixelRatio * window.innerWidth);
    canvas.height = Math.floor(window.devicePixelRatio * window.innerHeight);
    // Normalize coordinate system to use css pixels
    canvas.getContext("2d")?.scale(window.devicePixelRatio, window.devicePixelRatio);

    return canvas;
}
