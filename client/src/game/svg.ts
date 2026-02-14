// oxlint-disable-next-line import/no-unassigned-import
import "path-data-polyfill";
import { addP, getCenterLine, toArrayP, toGP, Vector } from "../core/geometry";
import type { GlobalPoint } from "../core/geometry";
import { http } from "../core/http";

import type { IAsset } from "./interfaces/shapes/asset";
import { drawLine } from "./rendering/basic";
import { floorState } from "./systems/floors/state";

export async function loadSvgData(url: string): Promise<NodeList> {
    const response = await http.get(url);
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

function parseTransform(oldTransform: Transform | undefined, transformList: SVGTransformList): Transform {
    const newTransform = copyTransform(oldTransform);
    for (const t of transformList) {
        if (t.type === 2) {
            newTransform.push({ type: "translate", value: [t.matrix.e, t.matrix.f] });
        } else if (t.type === 3) {
            newTransform.push({ type: "scale", value: [t.matrix.a, t.matrix.d] });
        } else {
            console.log("Unsupported svg transform type encountered, please bother Kruptein to fix this", t);
        }
    }
    return newTransform;
}

export function* getPaths(
    shape: IAsset,
    svgEl: SVGSVGElement,
    dW: number,
    dH: number,
    transform?: Transform,
): Generator<[number, number][][], void, void> {
    for (const child of svgEl.children) {
        if (child.tagName === "g") {
            const newTransform = parseTransform(transform, (child as SVGSVGElement).transform.baseVal);
            yield* getPaths(shape, child as SVGSVGElement, dW, dH, newTransform);
        } else if (child.tagName === "path") {
            const path = child.getAttribute("d");
            if (path === null) continue;

            const newTransform = parseTransform(transform, (child as SVGSVGElement).transform.baseVal);
            yield pathToArray(shape, child as SVGPathElement, dW, dH, newTransform);
        }
    }
}

const DEBUG_SVG = false;
export function pathToArray(
    shape: IAsset,
    path: SVGPathElement,
    dW: number,
    dH: number,
    transform?: Transform,
): [number, number][][] {
    const paths: [number, number][][] = [];

    let currentLocation = toGP(0, 0);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const pathData = (path as any).getPathData();

    let points: [number, number][] = [];

    const targetRP = shape.refPoint;

    for (const seg of pathData) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        let point = applyTransform(seg.values, transform, true);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        switch (seg.type) {
            case "Z": {
                //ClosePath
                if (points.length > 0) currentLocation = toGP(points[0]!);
                break;
            }
            case "M": {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                point = applyTransform(seg.values, transform);
                //MoveToAbs
                currentLocation = toGP(targetRP.x + point[0] * dW, targetRP.y + point[1] * dH);
                break;
            }
            case "m": {
                //MoveToRel
                if (points.length > 0) {
                    points.push(points[0]!);
                    paths.push(points);
                }
                points = [];
                currentLocation = addP(currentLocation, new Vector(dW * point[0], dH * point[1]));
                break;
            }
            case "L": {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                currentLocation = handleBezierCurve(seg.values, transform, dW, dH, currentLocation, points, true);
                continue;
            }
            case "c": {
                // bezier curve
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                currentLocation = handleBezierCurve(seg.values, transform, dW, dH, currentLocation, points, false);
                continue;
            }
            default: {
                //throw error;
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-member-access
                console.warn("Path contains unsupported segment: " + seg.type);
                break;
            }
        }
        points.push(toArrayP(currentLocation));
        if (DEBUG_SVG) {
            const l = points.length;
            if (floorState.currentFloor.value !== undefined) {
                if (l > 1) {
                    drawLine(points[l - 2]!, points[l - 1]!, false, { constrained: true });
                }
            }
        }
    }

    paths.push(points);

    return paths;
}

function handleBezierCurve(
    values: number[],
    transform: Transform | undefined,
    dW: number,
    dH: number,
    currentLocation: GlobalPoint,
    points: [number, number][],
    absolute: boolean,
): GlobalPoint {
    const cp1 = applyTransform(values.slice(0, 2) as [number, number], transform, !absolute);
    const cp1g = addP(currentLocation, new Vector(dW * cp1[0], dH * cp1[1]));
    const cp2 = applyTransform(values.slice(2, 4) as [number, number], transform, !absolute);
    const cp2g = addP(currentLocation, new Vector(dW * cp2[0], dH * cp2[1]));
    const end = applyTransform(values.slice(4, 6) as [number, number], transform, !absolute);
    const endg = addP(currentLocation, new Vector(dW * end[0], dH * end[1]));

    for (const l of splitBezier(
        [currentLocation.x, currentLocation.y],
        [endg.x, endg.y],
        [cp1g.x, cp1g.y],
        [cp2g.x, cp2g.y],
    )) {
        points.push(l[1]!);
        if (DEBUG_SVG) drawLine(points.at(-2)!, l[1]!, false, { constrained: true });
    }
    return endg;
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
