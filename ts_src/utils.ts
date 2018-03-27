import { Shape } from "./shapes";

export interface Point {
    x: number;
    y: number;
}


export function alphSort(a: string, b: string) {
    if (a.toLowerCase() < b.toLowerCase())
        return -1;
    else
        return 1;
}

// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export class OrderedMap {
    data: Shape[] = [];
    push(element: Shape) {
        this.data.push(element);
    }
    indexOf(element: Shape) {
        return this.data.indexOf(element);
    }
    remove(element: Shape) {
        this.data.splice(this.indexOf(element), 1);
    }
    moveTo(element: Shape, idx: number) {
        const oldIdx = this.indexOf(element);
        if (oldIdx === idx) return false;
        this.data.splice(oldIdx, 1);
        this.data.splice(idx, 0, element);
        return true;
    }
}