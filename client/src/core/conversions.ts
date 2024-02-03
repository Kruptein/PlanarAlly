import { positionState } from "../game/systems/position/state";
import { locationSettingsState } from "../game/systems/settings/location/state";
import { playerSettingsState } from "../game/systems/settings/players/state";

import { Ray, toGP, toLP } from "./geometry";
import type { GlobalPoint, LocalPoint } from "./geometry";
import { DEFAULT_GRID_SIZE } from "./grid";

export function g2l(obj: GlobalPoint): LocalPoint {
    const state = positionState.readonly;
    return toLP((obj.x + state.panX) * state.zoom, (obj.y + state.panY) * state.zoom);
}

export function g2lx(x: number): number {
    return g2l(toGP(x, 0)).x;
}

export function g2ly(y: number): number {
    return g2l(toGP(0, y)).y;
}

export function g2lz(z: number): number {
    return z * positionState.readonly.zoom;
}

export function getUnitDistance(r: number): number {
    return (r / locationSettingsState.raw.unitSize.value) * DEFAULT_GRID_SIZE;
}

export function g2lr(r: number): number {
    return g2lz(getUnitDistance(r));
}

export function l2g(obj: LocalPoint): GlobalPoint;
export function l2g(obj: Ray<LocalPoint>): Ray<GlobalPoint>;
export function l2g(obj: LocalPoint | Ray<LocalPoint>): GlobalPoint | Ray<GlobalPoint> {
    const state = positionState.readonly;
    const z = state.zoom;
    if (obj instanceof Ray) {
        return new Ray<GlobalPoint>(l2g(obj.origin), obj.direction.multiply(1 / z), obj.tMax);
    } else {
        return toGP(obj.x / z - state.panX, obj.y / z - state.panY);
    }
}

export function l2gx(x: number): number {
    return l2g(toLP(x, 0)).x;
}

export function l2gy(y: number): number {
    return l2g(toLP(0, y)).y;
}

export function l2gz(z: number): number {
    return z / positionState.readonly.zoom;
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
    return (zoomValue * playerSettingsState.gridSize.value) / DEFAULT_GRID_SIZE;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).g2l = g2l;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).l2g = l2g;
