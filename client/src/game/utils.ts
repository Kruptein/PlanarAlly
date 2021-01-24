import tinycolor from "tinycolor2";

import { GlobalPoint, LocalPoint, Vector } from "@/game/geom";

import { gameSettingsStore } from "./settings";
import { gameStore } from "./store";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getLocalPointFromEvent(e: any): LocalPoint {
    if (e instanceof MouseEvent) {
        return getMouse(e);
    } else if (e instanceof TouchEvent) {
        return getTouch(e);
    } else {
        return getMouse(e);
    }
}

function getMouse(e: MouseEvent): LocalPoint {
    return new LocalPoint(e.pageX, e.pageY);
}

// takes a given touch event and converts to LocalPoint
function getTouch(e: TouchEvent): LocalPoint {
    // touches is a TouchList, which is a list of touches (for each finger)
    // default to first touch (first index) to get x/y
    return new LocalPoint(e.touches[0].pageX, e.touches[0].pageY);
}

export function getFogColour(opposite = false): string {
    const tc = tinycolor(gameStore.fowColour);
    if (gameStore.IS_DM) tc.setAlpha(opposite ? 1 : gameSettingsStore.fowOpacity);
    else tc.setAlpha(1);
    return tc.toRgbString();
}

export function equalPoint(a: number, b: number, delta = 0.0001): boolean {
    return a - delta < b && a + delta > b;
}

export function equalPoints(a: number[], b: number[], delta = 0.0001): boolean {
    return equalPoint(a[0], b[0], delta) && equalPoint(a[1], b[1], delta);
}

export function useSnapping(event: MouseEvent | TouchEvent): boolean {
    return gameStore.invertAlt === event.altKey;
}

export function rotateAroundPoint(point: GlobalPoint, center: GlobalPoint, angle: number): GlobalPoint {
    if (angle === 0) return point;
    if (equalPoints([...center], [...point])) return point;

    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new GlobalPoint(
        c * (point.x - center.x) - s * (point.y - center.y) + center.x,
        s * (point.x - center.x) + c * (point.y - center.y) + center.y,
    );
}

export function filterEqualPoints(points: GlobalPoint[]): GlobalPoint[] {
    return points.filter((val, i, arr) => arr.findIndex((t) => t.equals(val)) === i);
}

export function getPointsCenter(points: GlobalPoint[]): GlobalPoint {
    const vertexAvg = points
        .reduce((acc: Vector, val: GlobalPoint) => acc.add(new Vector(val.x, val.y)), new Vector(0, 0))
        .multiply(1 / points.length);
    return GlobalPoint.fromArray([...vertexAvg]);
}
