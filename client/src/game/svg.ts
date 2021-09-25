import "path-data-polyfill";
import { addP, getCenterLine, toArrayP, toGP, Vector } from "../core/geometry";
import { baseAdjustedFetch } from "../core/utils";
import { floorStore } from "../store/floor";

import { drawLine } from "./draw";
import type { Asset } from "./shapes/variants/asset";

export async function loadSvgData(url: string): Promise<NodeList> {
    const response = await baseAdjustedFetch(url);
    const data = await response.text();

    const template = document.createElement("template");
    template.innerHTML = data;
    return template.content.querySelectorAll("svg");
}

interface ScaleTransform {
    type: "scale";
    value: [number, number];
}

interface TranslateTransform {
    type: "translate";
    value: [number, number];
}

type Transform = (ScaleTransform | TranslateTransform)[];

function copyTransform(transform: Transform | undefined): Transform {
    if (transform === undefined) return [];
    return transform.map((t) => ({ ...t, value: [...t.value] as [number, number] }));
}

function applyTransform(point: [number, number], transform?: Transform, scale = false): [number, number] {
    if (transform === undefined) return point;
    for (const t of transform.slice().reverse()) {
        if (t.type === "scale") {
            point = [point[0] * t.value[0], point[1] * t.value[1]];
        } else if (t.type === "translate" && !scale) {
            point = [point[0] + t.value[0], point[1] + t.value[1]];
        }
    }
    return point;
}

export function* getPaths(
    shape: Asset,
    svgEl: SVGSVGElement,
    dW: number,
    dH: number,
    transform?: Transform,
): Generator<[number, number][][], void, void> {
    for (const child of svgEl.children) {
        if (child.tagName === "g") {
            const newTransform = copyTransform(transform);
            for (const t of (child as SVGSVGElement).transform.baseVal) {
                if (t.type === 2) {
                    newTransform.push({ type: "translate", value: [t.matrix.e, t.matrix.f] });
                } else if (t.type === 3) {
                    newTransform.push({ type: "scale", value: [t.matrix.a, t.matrix.d] });
                } else {
                    console.log("Unsupported svg transform type encountered, please bother Kruptein to fix this", t);
                }
            }
            yield* getPaths(shape, child as SVGSVGElement, dW, dH, newTransform);
        } else if (child.tagName === "path") {
            const path = child.getAttribute("d");
            if (path === null) continue;

            const newTransform = copyTransform(transform);
            for (const t of (child as SVGSVGElement).transform.baseVal) {
                if (t.type === 2) {
                    newTransform.push({ type: "translate", value: [t.matrix.e, t.matrix.f] });
                } else if (t.type === 3) {
                    newTransform.push({ type: "scale", value: [t.matrix.a, t.matrix.d] });
                } else {
                    console.log("Unsupported svg transform type encountered, please bother Kruptein to fix this", t);
                }
            }
            yield pathToArray(shape, child as SVGPathElement, dW, dH, newTransform);
        }
    }
}

const DEBUG_SVG = false;
export function pathToArray(
    shape: Asset,
    path: SVGPathElement,
    dW: number,
    dH: number,
    transform?: Transform,
): [number, number][][] {
    const paths: [number, number][][] = [];

    let currentLocation = toGP(0, 0);
    const pathData = (path as any).getPathData();

    let points: [number, number][] = [];

    const targetRP = shape.refPoint;

    for (const seg of pathData) {
        let point = applyTransform(seg.values, transform, true);
        switch (seg.type) {
            case "Z": {
                //ClosePath
                currentLocation = toGP(points[0]);
                break;
            }
            case "M": {
                point = applyTransform(seg.values, transform);
                //MoveToAbs
                currentLocation = toGP(targetRP.x + point[0] * dW, targetRP.y + point[1] * dH);
                break;
            }
            case "m": {
                //MoveToRel
                points.push(points[0]);
                paths.push(points);
                points = [];
                currentLocation = addP(currentLocation, new Vector(dW * point[0], dH * point[1]));
                break;
            }
            case "L": {
                point = applyTransform(seg.values, transform);
                //LineToAbs
                currentLocation = toGP(targetRP.x + dW * point[0], targetRP.y + dH * point[1]);
                break;
            }
            case "l": {
                //LineToRel
                currentLocation = addP(currentLocation, new Vector(dW * point[0], dH * point[1]));
                break;
            }
            case "H": {
                point = applyTransform(seg.values, transform);
                //LineToHorizontalAbs
                currentLocation = toGP(targetRP.x + dW * point[0], targetRP.y + dH * currentLocation.y);
                break;
            }
            case "h": {
                // LineToHorizontalRel
                currentLocation = addP(currentLocation, new Vector(dW * point[0], 0));
                break;
            }
            case "V": {
                point = applyTransform(seg.values, transform);
                // LineToVerticalAbs
                currentLocation = toGP(targetRP.x + dW * currentLocation.x, targetRP.y + dH * point[0]);
                break;
            }
            case "v": {
                // LineToVerticalRel
                currentLocation = addP(currentLocation, new Vector(0, dH * point[0]));
                break;
            }
            case "C": {
                // bezier curve
                currentLocation = toGP(targetRP.x + point[0] * dW, targetRP.y + point[1] * dH);
                break;
            }
            case "c": {
                const cp1 = applyTransform(seg.values, transform, true);
                const cp1g = addP(currentLocation, new Vector(dW * cp1[0], dH * cp1[1]));
                const cp2 = applyTransform(seg.values.slice(2), transform, true);
                const cp2g = addP(currentLocation, new Vector(dW * cp2[0], dH * cp2[1]));
                const end = applyTransform(seg.values.slice(4), transform, true);
                const endg = addP(currentLocation, new Vector(dW * end[0], dH * end[1]));
                for (const l of splitBezier(
                    [currentLocation.x, currentLocation.y],
                    [endg.x, endg.y],
                    [cp1g.x, cp1g.y],
                    [cp2g.x, cp2g.y],
                )) {
                    points.push(l[1]);
                    if (DEBUG_SVG) drawLine(points[points.length - 2], l[1], true, false);
                }
                // bezier curve
                currentLocation = endg; // addP(currentLocation, new Vector(dW * end[0], dH * end[1]));
                continue;
            }
            default: {
                //throw error;
                console.warn("Path contains unsupported segment: " + seg.type);
                break;
            }
        }
        points.push(toArrayP(currentLocation));
        if (DEBUG_SVG) {
            const l = points.length;
            if (floorStore.currentFloor.value !== undefined) {
                if (l > 1) {
                    drawLine(points[l - 2], points[l - 1], true, false);
                }
            }
        }
    }

    paths.push(points);

    return paths;
}

// Recursive de Casteljau
function* splitBezier(
    start: [number, number],
    end: [number, number],
    cp1: [number, number],
    cp2: [number, number],
): Generator<[number, number][]> {
    if (isFlatCurve(start, cp1, cp2)) {
        yield [start, end];
        return;
    }
    const p1 = getCenterLine(start, cp1);
    const p2 = getCenterLine(cp1, cp2);
    const p3 = getCenterLine(cp2, end);

    const p12 = getCenterLine(p1, p2);
    const p23 = getCenterLine(p2, p3);

    const p1234 = getCenterLine(p12, p23);

    yield* splitBezier(start, p1234, p1, p12);
    yield* splitBezier(p1234, end, p23, p3);
}

function isFlatCurve(start: [number, number], cp1: [number, number], cp2: [number, number]): boolean {
    const t1 = (cp1[1] - start[1]) * (cp2[0] - cp1[0]);
    const t2 = (cp2[1] - cp1[1]) * (cp1[0] - start[0]);
    return Math.abs(t1 - t2) < 5;
}
