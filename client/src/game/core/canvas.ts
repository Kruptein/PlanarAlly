// Unified canvas interfaces to work with regardless of context

// Contains the common elements between the DOM and Offscreen variants
export interface CanvasContext
    extends CanvasCompositing,
        CanvasDrawImage,
        CanvasDrawPath,
        CanvasFillStrokeStyles,
        CanvasFilters,
        CanvasImageData,
        CanvasImageSmoothing,
        CanvasPath,
        CanvasPathDrawingStyles,
        CanvasRect,
        CanvasShadowStyles,
        CanvasState,
        CanvasText,
        CanvasTextDrawingStyles,
        CanvasTransform {}

export interface Canvas {
    getContext: (contextId: "2d") => CanvasContext | null;
}

declare global {
    interface CanvasDrawImage {
        // eslint-disable-next-line @typescript-eslint/method-signature-style
        drawImage(image: Canvas, dx: number, dy: number): void;
        // eslint-disable-next-line @typescript-eslint/method-signature-style
        drawImage(image: Canvas, dx: number, dy: number, dw: number, dh: number): void;
        // eslint-disable-next-line @typescript-eslint/method-signature-style
        drawImage(
            image: Canvas,
            sx: number,
            sy: number,
            sw: number,
            sh: number,
            dx: number,
            dy: number,
            dw: number,
            dh: number,
        ): void;
    }
}
