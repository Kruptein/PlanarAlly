export function getInputPosition(event: MouseEvent | TouchEvent): { x: number; y: number } {
    if (event instanceof MouseEvent) {
        return { x: event.pageX, y: event.pageY };
    } else {
        return { x: event.touches?.[0].pageX ?? 0, y: event.touches?.[0].pageY ?? 0 };
    }
}
