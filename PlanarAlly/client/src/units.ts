import gameManager from "./planarally";

export function w2l(obj) {
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    return {
        x: (obj.x + panX) * z,
        y: (obj.y + panY) * z
    }
}

export function w2lx(x) {
    return w2l({x: x, y: 0}).x;
}

export function w2ly(y) {
    return w2l({x: 0, y: y}).y;
}

export function w2lz(z) {
    return z * gameManager.layerManager.zoomFactor;
}

export function getUnitDistance(r) {
    return (r / gameManager.layerManager.unitSize) * gameManager.layerManager.gridSize;
}

export function w2lr(r) {
    return w2lz(getUnitDistance(r))
}

export function l2w(obj) {
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    return {
        x: (obj.x / z) - panX,
        y: (obj.y / z) - panY
    }
}

export function l2wx(x) {
    return l2w({x: x, y: 0}).x;
}

export function l2wy(y) {
    return l2w({x: 0, y: y}).y;
}