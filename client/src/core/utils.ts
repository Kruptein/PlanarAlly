// Reference: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
export function uuidv4(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function alphSort(a: string, b: string): number {
    if (a.toLowerCase() < b.toLowerCase()) return -1;
    else return 1;
}

export function getHTMLFont(element: HTMLElement): string {
    let font = element.style.font;
    while (font === null && element.parentElement !== null) {
        element = element.parentElement;
        font = element.style.font;
    }
    if (font === null) font = window.getComputedStyle(document.body).getPropertyValue("font");
    return font;
}

export function getHTMLTextWidth(text: string, font: string): number {
    let fakeElement = <HTMLCanvasElement>document.getElementById("emptycanvas");
    if (fakeElement === null) {
        fakeElement = document.createElement("canvas");
        fakeElement.id = "emptycanvas";
        fakeElement.style.display = "";
        document.body.appendChild(fakeElement);
    }
    const ctx = fakeElement.getContext("2d")!;
    ctx.font = font;
    return Math.ceil(ctx.measureText(text).width);
}

export function partition<T>(arr: T[], predicate: (n: T) => boolean): T[][] {
    const ret: T[][] = [[], []];
    arr.forEach(n => (predicate(n) ? ret[1].push(n) : ret[0].push(n)));
    return ret;
}

export function calcFontScale(ctx: CanvasRenderingContext2D, text: string, r: number): number {
    const fontWidth = ctx.measureText(text).width;
    const fontSize = Number(ctx.font.split("px")[0]) * 1.5;
    return (Math.cos(Math.atan(fontSize / fontWidth)) * 2 * r) / fontWidth;
}

export function fixedEncodeURIComponent(str: string): string {
    return encodeURIComponent(str).replace(/[!'()*]/g, c => {
        return "%" + c.charCodeAt(0).toString(16);
    });
}

export class OrderedMap<K, V> {
    keys: K[] = [];
    values: V[] = [];

    get length(): number {
        return this.keys.length;
    }

    get(key: K): V {
        return this.values[this.keys.indexOf(key)];
    }
    getIndexValue(idx: number): V {
        return this.values[idx];
    }
    getIndexKey(idx: number): K {
        return this.keys[idx];
    }
    set(key: K, value: V): void {
        this.keys.push(key);
        this.values.push(value);
    }
    has(key: K): boolean {
        return this.indexOf(key) >= 0;
    }
    indexOf(element: K): number {
        return this.keys.indexOf(element);
    }
    remove(element: K): void {
        const idx = this.indexOf(element);
        this.keys.splice(idx, 1);
        this.values.splice(idx, 1);
    }
}

export async function postFetch(url: string, data?: any): Promise<Response> {
    return await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data ?? {}),
    });
}
