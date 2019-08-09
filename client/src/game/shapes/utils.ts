import {
    ServerAsset,
    ServerCircle,
    ServerCircularToken,
    ServerLine,
    ServerMultiLine,
    ServerPolygon,
    ServerRect,
    ServerShape,
    ServerText,
} from "@/game/comm/types/shapes";
import { GlobalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { Asset } from "@/game/shapes/asset";
import { Circle } from "@/game/shapes/circle";
import { CircularToken } from "@/game/shapes/circulartoken";
import { Line } from "@/game/shapes/line";
import { MultiLine } from "@/game/shapes/multiline";
import { Rect } from "@/game/shapes/rect";
import { Shape } from "@/game/shapes/shape";
import { Text } from "@/game/shapes/text";
import { Polygon } from "./polygon";

export function createShapeFromDict(shape: ServerShape): Shape | undefined {
    let sh: Shape;

    // A fromJSON and toJSON on Shape would be cleaner but ts does not allow for static abstracts so yeah.

    // Shape Type specifics

    const refPoint = new GlobalPoint(shape.x, shape.y);
    if (shape.type_ === "rect") {
        const rect = <ServerRect>shape;
        sh = new Rect(refPoint, rect.width, rect.height, rect.fill_colour, rect.stroke_colour, rect.uuid);
    } else if (shape.type_ === "circle") {
        const circ = <ServerCircle>shape;
        sh = new Circle(refPoint, circ.radius, circ.fill_colour, circ.stroke_colour, circ.uuid);
    } else if (shape.type_ === "circulartoken") {
        const token = <ServerCircularToken>shape;
        sh = new CircularToken(
            refPoint,
            token.radius,
            token.text,
            token.font,
            token.fill_colour,
            token.stroke_colour,
            token.uuid,
        );
    } else if (shape.type_ === "line") {
        const line = <ServerLine>shape;
        sh = new Line(refPoint, new GlobalPoint(line.x2, line.y2), line.line_width, line.stroke_colour, line.uuid);
    } else if (shape.type_ === "multiline") {
        const multiline = <ServerMultiLine>shape;
        sh = new MultiLine(
            refPoint,
            multiline.points.map(p => new GlobalPoint(p.x, p.y)),
            multiline.line_width,
            multiline.stroke_colour,
            multiline.uuid,
        );
    } else if (shape.type_ === "polygon") {
        const polygon = <ServerPolygon>shape;
        sh = new Polygon(
            refPoint,
            polygon.vertices.map(v => new GlobalPoint(v.x, v.y)),
            polygon.fill_colour,
            polygon.stroke_colour,
            polygon.uuid,
        );
    } else if (shape.type_ === "text") {
        const text = <ServerText>shape;
        sh = new Text(refPoint, text.text, text.font, text.angle, text.fill_colour, text.stroke_colour, text.uuid);
    } else if (shape.type_ === "assetrect") {
        const asset = <ServerAsset>shape;
        const img = new Image(asset.width, asset.height);
        if (asset.src.startsWith("http")) img.src = new URL(asset.src).pathname;
        else img.src = asset.src;
        sh = new Asset(img, refPoint, asset.width, asset.height, asset.uuid);
        img.onload = () => {
            layerManager.getLayer(shape.layer)!.invalidate(false);
        };
    } else {
        return undefined;
    }
    sh.fromDict(shape);
    return sh;
}
