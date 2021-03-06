import "path-data-polyfill";

import { GlobalPoint, Vector } from "./geom";
import { Asset } from "./shapes/variants/asset";

export function pathToArray(shape: Asset, path: SVGPathElement): number[][][] {
    const paths: number[][][] = [];

    let currentLocation = new GlobalPoint(0, 0);
    const pathData = (path as any).getPathData();

    let points: number[][] = [];

    const targetRP = shape.refPoint;
    const w = shape.w;
    const h = shape.h;

    const dW = w / shape.options.get("svgWidth");
    const dH = h / shape.options.get("svgHeight");

    for (const seg of pathData) {
        switch (seg.type) {
            case "Z": {
                //ClosePath
                currentLocation = GlobalPoint.fromArray(points[0]);
                break;
            }
            case "M": {
                //MoveToAbs
                currentLocation = new GlobalPoint(targetRP.x + seg.values[0] * dW, targetRP.y + seg.values[1] * dH);
                break;
            }
            case "m": {
                //MoveToRel
                points.push(points[0]);
                paths.push(points);
                points = [];
                currentLocation = currentLocation.add(new Vector(dW * seg.values[0], dH * seg.values[1]));
                break;
            }
            case "L": {
                //LineToAbs
                currentLocation = new GlobalPoint(targetRP.x + dW * seg.values[0], targetRP.y + dH * seg.values[1]);
                break;
            }
            case "l": {
                //LineToRel
                currentLocation = currentLocation.add(new Vector(dW * seg.values[0], dH * seg.values[1]));
                break;
            }
            case "H": {
                //LineToHorizontalAbs
                currentLocation = new GlobalPoint(targetRP.x + dW * seg.values[0], targetRP.y + dH * currentLocation.y);
                break;
            }
            case "h": {
                // LineToHorizontalRel
                currentLocation = currentLocation.add(new Vector(dW * seg.values[0], 0));
                break;
            }
            case "V": {
                // LineToVerticalAbs
                currentLocation = new GlobalPoint(targetRP.x + dW * currentLocation.x, targetRP.y + dH * seg.values[0]);
                break;
            }
            case "v": {
                // LineToVerticalRel
                currentLocation = currentLocation.add(new Vector(0, dH * seg.values[0]));
                break;
            }
            case "C": {
                // bezier curve
                currentLocation = new GlobalPoint(targetRP.x + seg.values[0] * dW, targetRP.y + seg.values[1] * dH);
                break;
            }
            case "c": {
                // bezier curve
                currentLocation = currentLocation.add(new Vector(dW * seg.values[4], dH * seg.values[5]));
                break;
            }
            default: {
                //throw error;
                console.warn("Path contains unsupported segment: " + seg.type);
                break;
            }
        }
        points.push(currentLocation.asArray());
    }

    paths.push(points);

    return paths;
}
