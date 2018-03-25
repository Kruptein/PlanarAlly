export interface Point {
    x: number;
    y: number;
}


export function alphSort(a, b) {
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

export function OrderedMap() {
    this.data = [];
}

OrderedMap.prototype = [];
OrderedMap.prototype.push = function (element) {
    this.data.push(element);
};
OrderedMap.prototype.remove = function (element) {
    this.data.splice(this.data.indexOf(element), 1);
};
OrderedMap.prototype.indexOf = function (element) {
    return this.data.indexOf(element);
};
OrderedMap.prototype.moveTo = function (element, idx) {
    const oldIdx = this.indexOf(element);
    if (oldIdx === idx) return false;
    this.data.splice(oldIdx, 1);
    this.data.splice(idx, 0, element);
    return true;
};