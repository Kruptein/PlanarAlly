import type { BackgroundPattern } from "../core/models/floor";

export function getPattern(pattern: string): BackgroundPattern | undefined {
    const regex = /pattern\(([a-zA-Z0-9-_]+),([\d.]+),([\d.]+).([\d.]+).([\d.]+)\)/;
    const output = pattern.match(regex);
    if (output === null || output[0] === "" || output.length < 6) {
        return undefined;
    }
    return {
        hash: output[1]!,
        offsetX: Number.parseFloat(output[2]!),
        offsetY: Number.parseFloat(output[3]!),
        scaleX: Number.parseFloat(output[4]!),
        scaleY: Number.parseFloat(output[5]!),
    };
}

export function patternToString(pattern: BackgroundPattern): string {
    return `pattern(${pattern.hash},${pattern.offsetX},${pattern.offsetY},${pattern.scaleX},${pattern.scaleY})`;
}
