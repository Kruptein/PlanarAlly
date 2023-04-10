import type { PressedModifiers } from "../../common/events";

export function getPressedModifiers(event: MouseEvent | TouchEvent | undefined): PressedModifiers | undefined {
    if (event === undefined) return undefined;

    return {
        alt: event.altKey,
        ctrl: event.ctrlKey,
        meta: event.metaKey,
        shift: event.shiftKey,
    };
}
