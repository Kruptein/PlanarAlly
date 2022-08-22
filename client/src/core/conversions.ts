import { clientStore, DEFAULT_GRID_SIZE, ZOOM } from "../store/client";
import { settingsStore } from "../store/settings";

import { Ray, toGP, toLP } from "./geometry";
import type { GlobalPoint, LocalPoint } from "./geometry";

export function g2l(obj: GlobalPoint): LocalPoint {
    const state = clientStore.state;
    const panX = state.panX;
    const panY = state.panY;
    return toLP((obj.x + panX) * ZOOM, (obj.y + panY) * ZOOM);
}

export function g2lx(x: number): number {
    return g2l(toGP(x, 0)).x;
}

export function g2ly(y: number): number {
    return g2l(toGP(0, y)).y;
}

export function g2lz(z: number): number {
    return z * ZOOM;
}

export function getUnitDistance(r: number): number {
    return (r / settingsStore.unitSize.value) * DEFAULT_GRID_SIZE;
}

export function g2lr(r: number): number {
    return g2lz(getUnitDistance(r));
}

export function l2g(obj: LocalPoint): GlobalPoint;
export function l2g(obj: Ray<LocalPoint>): Ray<GlobalPoint>;
export function l2g(obj: LocalPoint | Ray<LocalPoint>): GlobalPoint | Ray<GlobalPoint> {
    const state = clientStore.state;
    const z = ZOOM;
    const panX = state.panX;
    const panY = state.panY;
    if (obj instanceof Ray) {
        return new Ray<GlobalPoint>(l2g(obj.origin), obj.direction.multiply(1 / z), obj.tMax);
    } else {
        return toGP(obj.x / z - panX, obj.y / z - panY);
    }
}

export function l2gx(x: number): number {
    return l2g(toLP(x, 0)).x;
}

export function l2gy(y: number): number {
    return l2g(toLP(0, y)).y;
}

export function l2gz(z: number): number {
    return z / ZOOM;
}

export function clampGridLine(point: number): number {
    return Math.round(point / DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE;
}

export function clampToGrid(point: GlobalPoint): GlobalPoint {
    return toGP(clampGridLine(point.x), clampGridLine(point.y));
}

export function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

// eslint-disable-next-line import/no-unused-modules
export function toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
}

// Powercurve 0.2/3/10
// Based on https://stackoverflow.com/a/17102320
export function zoomDisplayToFactor(display: number): number {
    const zoomValue = 1 / (-5 / 3 + (28 / 15) * Math.exp(1.83 * display));
    return (zoomValue * clientStore.gridSize.value) / DEFAULT_GRID_SIZE;
}
