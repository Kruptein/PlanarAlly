/**
 * This is a helper file to deal with firefox bugs
 */

let activeDropHandler: ((event: DragEvent) => void) | undefined = undefined;

export function registerDropCallback(handler: (event: DragEvent) => void): void {
    activeDropHandler = handler;
}
export function clearDropCallback(): void {
    activeDropHandler = undefined;
}

export function handleDrop(event: DragEvent): void {
    if (activeDropHandler !== undefined) activeDropHandler(event);
}
