import { BASE_PATH } from "../utils";

// Reference: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
export function uuidv4(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
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

export function calcFontScale(ctx: CanvasRenderingContext2D, text: string, r: number): number {
    const fontWidth = ctx.measureText(text).width;
    const fontSize = Number(ctx.font.split("px")[0]) * 1.5;
    return (Math.cos(Math.atan(fontSize / fontWidth)) * 2 * r) / fontWidth;
}

export async function baseAdjustedFetch(url: string): Promise<Response> {
    if (url.startsWith("/")) url = url.slice(1);
    return fetch(BASE_PATH + url);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function postFetch(url: string, data?: any): Promise<Response> {
    if (url.startsWith("/")) url = url.slice(1);
    return fetch(BASE_PATH + url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data ?? {}),
    });
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function patchFetch(url: string, data?: any): Promise<Response> {
    if (url.startsWith("/")) url = url.slice(1);
    return fetch(BASE_PATH + url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data ?? {}),
    });
}

export function baseAdjust(url: string): string {
    if (url.startsWith("/")) url = url.slice(1);
    return BASE_PATH + url;
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
