import tinycolor from "tinycolor2";

import type { GlobalId } from "../core/id";

// Reference: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
export function uuidv4(): GlobalId {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    }) as GlobalId;
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

const readableMemory = new Map<string, string>();

export function mostReadable(colour: string): string {
    const mem = readableMemory.get(colour);
    if (mem !== undefined) return mem;
    const col = tinycolor.mostReadable(colour, ["#000", "#fff"]).toHexString();
    readableMemory.set(colour, col);
    return col;
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

export function callbackProvider(): {
    wait: (id?: string) => Promise<void>;
    resolveAll: () => void;
} {
    let callbacks: { id?: string; cb: () => void }[] = [];

    function wait(id?: string): Promise<void> {
        if (id !== undefined && callbacks.some((c) => c.id === id)) return Promise.reject();
        return new Promise((resolve, _reject) => {
            callbacks.push({ id, cb: resolve });
        });
    }

    function resolveAll(): void {
        for (const { cb } of callbacks) cb();
        callbacks = [];
    }

    return {
        resolveAll,
        wait,
    };
}

// This only works in HTTPS (or localhost) context!
// It will throw an error otherwise.
async function sha1(source: string): Promise<string> {
    const sourceBytes = new TextEncoder().encode(source);
    const digest = await crypto.subtle.digest("SHA-1", sourceBytes);
    const resultBytes = [...new Uint8Array(digest)];
    return resultBytes.map((x) => x.toString(16).padStart(2, "0")).join("");
}

const wordMemory = new Map<string, string>();

export async function word2color(word: string): Promise<string> {
    const mem = wordMemory.get(word);
    if (mem !== undefined) return mem;
    let rgb;
    try {
        const hash = await sha1(word);
        const r = parseInt(hash.substring(0, 2), 16);
        const g = parseInt(hash.substring(2, 4), 16);
        const b = parseInt(hash.substring(4, 6), 16);
        rgb = `rgb(${r}, ${g}, ${b})`;
    } catch {
        rgb = "rgba(0, 0, 0, 0.5)";
    }
    wordMemory.set(word, rgb);
    return rgb;
}
