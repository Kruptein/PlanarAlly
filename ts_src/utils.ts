import { LocalPoint } from "./geom";
import Settings from "./settings";
import gameManager from "./planarally";

(<any>window).getFogColour = getFogColour;

export function getMouse(e: MouseEvent): LocalPoint {
    return new LocalPoint(e.pageX, e.pageY);
}

export function getFogColour(opposite: boolean = false): string {
    const tc = gameManager.fowColour.spectrum("get");
    if (Settings.IS_DM)
        tc.setAlpha(opposite ? 1 : Settings.fowOpacity);
    else
        tc.setAlpha(1);
    return tc.toRgbString();
}

export function alphSort(a: string, b: string) {
    if (a.toLowerCase() < b.toLowerCase())
        return -1;
    else
        return 1;
}

export function partition<T>(arr: T[], predicate: (n: T) => boolean) {
    const ret: T[][] = [[], []];
    arr.forEach((n) => predicate(n) ? ret[1].push(n) : ret[0].push(n));
    return ret;
}

export function capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// Reference: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function calcFontScale(ctx: CanvasRenderingContext2D, text: string, width: number, height: number) {
    const points = Number(ctx.font.split("px")[0]) * 0.2;
    const fontWidth = ctx.measureText(text).width;
    return Math.min(width / fontWidth, height / points);
}

export function fixedEncodeURIComponent(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
      return '%' + c.charCodeAt(0).toString(16);
    });
  }

export class OrderedMap<K, V> {
    keys: K[] = [];
    values: V[] = [];
    get(key: K) {
        return this.values[this.keys.indexOf(key)];
    }
    getIndexValue(idx: number) {
        return this.values[idx];
    }
    getIndexKey(idx: number) {
        return this.keys[idx];
    }
    set(key: K, value: V) {
        this.keys.push(key);
        this.values.push(value);
    }
    indexOf(element: K) {
        return this.keys.indexOf(element);
    }
    remove(element: K) {
        const idx = this.indexOf(element);
        this.keys.splice(idx, 1);
        this.values.splice(idx, 1);
    }
}