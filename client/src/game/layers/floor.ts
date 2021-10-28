import { floorStore } from "../../store/floor";
import type { BackgroundPattern } from "../models/floor";

export function recalculateZIndices(): void {
    let i = 0;
    for (const floor of floorStore.state.floors) {
        for (const layer of floorStore.getLayers(floor)) {
            layer.canvas.style.zIndex = `${i}`;
            i += 1;
        }
    }
}

export function getPattern(pattern: string): BackgroundPattern | undefined {
    const regex = /pattern\(([a-zA-Z0-9-_]+),([\d.]+),([\d.]+).([\d.]+).([\d.]+)\)/;
    const output = pattern.match(regex);
    if (output === null || output[0] === "") {
        return undefined;
    }
    return {
        hash: output[1],
        offsetX: Number.parseFloat(output[2]),
        offsetY: Number.parseFloat(output[3]),
        scaleX: Number.parseFloat(output[4]),
        scaleY: Number.parseFloat(output[5]),
    };
}

export function patternToString(pattern: BackgroundPattern): string {
    return `pattern(${pattern.hash},${pattern.offsetX},${pattern.offsetY},${pattern.scaleX},${pattern.scaleY})`;
}
