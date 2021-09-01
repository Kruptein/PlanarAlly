export function getPosByEvent(e: MouseEvent | TouchEvent, elem: HTMLDivElement): { x: number; y: number } {
    const event = "targetTouches" in e ? e.targetTouches[0] : e;
    const offset = getOffset(elem);
    return {
        x: event.pageX - offset.x,
        y: event.pageY - offset.y,
    };
}

function getOffset(elem: HTMLDivElement): { x: number; y: number } {
    const doc = document.documentElement;
    const body = document.body;
    const rect = elem.getBoundingClientRect();
    return {
        x: rect.left + (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || body.clientLeft || 0),
        y: rect.top + (window.pageYOffset || doc.scrollTop) - (doc.clientTop || body.clientTop || 0),
    };
}
