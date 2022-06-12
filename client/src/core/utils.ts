import tinycolor from "tinycolor2";

import type { GlobalId } from "../game/id";

// Reference: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
export function uuidv4(): GlobalId {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    }) as GlobalId;
}

export function alphSort(a: string, b: string): number {
    if (a.toLowerCase() < b.toLowerCase()) return -1;
    else return 1;
}

export function toSnakeCase(s: string): string {
    return s
        .replace(/\.?([A-Z]+)/g, function (x, y) {
            return "_" + y.toLowerCase();
        })
        .replace(/^_/, "");
}

export function randomInterval(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function calcFontScale(ctx: CanvasRenderingContext2D, text: string, r: number): number {
    const fontWidth = ctx.measureText(text).width;
    const fontSize = Number(ctx.font.split("px")[0]) * 1.5;
    return (Math.cos(Math.atan(fontSize / fontWidth)) * 2 * r) / fontWidth;
}

export async function getErrorReason(response: Response): Promise<string> {
    const responseText: string = await response.text();
    // responseText will be "<statusCode>: <error message>"
    // trim that down, to just return the error message
    const index = responseText.indexOf(":");
    if (index >= 0) {
        return responseText.substring(index + 1).trim();
    }
    return responseText;
}

export function ctrlOrCmdPressed(event: KeyboardEvent | MouseEvent | TouchEvent): boolean {
    if (navigator.platform.includes("Mac")) return event.metaKey;
    return event.ctrlKey;
}

export function mostReadable(colour: string): string {
    return tinycolor.mostReadable(colour, ["#000", "#fff"]).toHexString();
}

export function getTarget(event: Event): HTMLInputElement {
    return event.target as HTMLInputElement;
}

export function getValue(event: Event): string {
    return getTarget(event).value;
}

export function getChecked(event: Event): boolean {
    return getTarget(event).checked;
}
