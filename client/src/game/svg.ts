import "path-data-polyfill";
import { addP, toArrayP, toGP, Vector } from "../core/geometry";

import { Asset } from "./shapes/variants/asset";

export function pathToArray(shape: Asset, path: SVGPathElement): number[][][] {
    const paths: number[][][] = [];

    let currentLocation = toGP(0, 0);
    const pathData = (path as any).getPathData();

    let points: [number, number][] = [];

    const targetRP = shape.refPoint;
    const w = shape.w;
    const h = shape.h;

    const dW = w / (shape.options.svgWidth ?? 1);
    const dH = h / (shape.options.svgHeight ?? 1);

    for (const seg of pathData) {
        switch (seg.type) {
            case "Z": {
                //ClosePath
                currentLocation = toGP(points[0]);
                break;
            }
            case "M": {
                //MoveToAbs
                currentLocation = toGP(targetRP.x + seg.values[0] * dW, targetRP.y + seg.values[1] * dH);
                break;
            }
            case "m": {
                //MoveToRel
                points.push(points[0]);
                paths.push(points);
                points = [];
                currentLocation = addP(currentLocation, new Vector(dW * seg.values[0], dH * seg.values[1]));
                break;
            }
            case "L": {
                //LineToAbs
                currentLocation = toGP(targetRP.x + dW * seg.values[0], targetRP.y + dH * seg.values[1]);
                break;
            }
            case "l": {
                //LineToRel
                currentLocation = addP(currentLocation, new Vector(dW * seg.values[0], dH * seg.values[1]));
                break;
            }
            case "H": {
                //LineToHorizontalAbs
                currentLocation = toGP(targetRP.x + dW * seg.values[0], targetRP.y + dH * currentLocation.y);
                break;
            }
            case "h": {
                // LineToHorizontalRel
                currentLocation = addP(currentLocation, new Vector(dW * seg.values[0], 0));
                break;
            }
            case "V": {
                // LineToVerticalAbs
                currentLocation = toGP(targetRP.x + dW * currentLocation.x, targetRP.y + dH * seg.values[0]);
                break;
            }
            case "v": {
                // LineToVerticalRel
                currentLocation = addP(currentLocation, new Vector(0, dH * seg.values[0]));
                break;
            }
            case "C": {
                // bezier curve
                currentLocation = toGP(targetRP.x + seg.values[0] * dW, targetRP.y + seg.values[1] * dH);
                break;
            }
            case "c": {
                // bezier curve
                currentLocation = addP(currentLocation, new Vector(dW * seg.values[4], dH * seg.values[5]));
                break;
            }
            default: {
                //throw error;
                console.warn("Path contains unsupported segment: " + seg.type);
                break;
            }
        }
        points.push(toArrayP(currentLocation));
    }

    paths.push(points);

    return paths;
}
