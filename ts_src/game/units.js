import { GlobalPoint, LocalPoint, Ray } from "./geom";
import store from "./store";
export function g2l(obj) {
    const z = store.state.zoomFactor;
    const panX = store.state.panX;
    const panY = store.state.panY;
    return new LocalPoint((obj.x + panX) * z, (obj.y + panY) * z);
}
export function g2lx(x) {
    return g2l(new GlobalPoint(x, 0)).x;
}
export function g2ly(y) {
    return g2l(new GlobalPoint(0, y)).y;
}
export function g2lz(z) {
    return z * store.state.zoomFactor;
}
export function getUnitDistance(r) {
    return (r / store.state.unitSize) * store.state.gridSize;
}
export function g2lr(r) {
    return g2lz(getUnitDistance(r));
}
export function l2g(obj) {
    const z = store.state.zoomFactor;
    const panX = store.state.panX;
    const panY = store.state.panY;
    if (obj instanceof LocalPoint) {
        return new GlobalPoint((obj.x / z) - panX, (obj.y / z) - panY);
    }
    else {
        return new Ray(l2g(obj.origin), obj.direction.multiply(1 / z), obj.tMax);
    }
}
export function l2gx(x) {
    return l2g(new LocalPoint(x, 0)).x;
}
export function l2gy(y) {
    return l2g(new LocalPoint(0, y)).y;
}
export function l2gz(z) {
    return z / store.state.zoomFactor;
}
export function l2gr(r) {
    return l2gz(getUnitDistance(r));
}
//# sourceMappingURL=units.js.map