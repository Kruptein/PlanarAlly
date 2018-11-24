import gameManager from "../manager";
import Asset from "./asset";
import Circle from "./circle";
import CircularToken from "./circulartoken";
import Line from "./line";
import MultiLine from "./multiline";
import Rect from "./rect";
import Shape from "./shape";
import Text from "./text";

import {
    ServerAsset,
    ServerCircle,
    ServerCircularToken,
    ServerLine,
    ServerMultiLine,
    ServerRect,
    ServerShape,
    ServerText,
} from "../comm/types/shapes";
import { GlobalPoint } from "../geom";

export function createShapeFromDict(shape: ServerShape, dummy?: boolean) {
    // TODO: is this dummy stuff actually needed, do we ever want to return the local shape?
    if (dummy === undefined) dummy = false;
    if (!dummy && gameManager.layerManager.UUIDMap.has(shape.uuid))
        return gameManager.layerManager.UUIDMap.get(shape.uuid);

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
        sh = new CircularToken(refPoint, token.radius, token.text, token.font, token.fill_colour, token.stroke_colour, token.uuid);
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
            gameManager.layerManager.getLayer(shape.layer)!.invalidate(false);
        };
    } else {
        return undefined;
    }
    sh.fromDict(shape);
    return sh;
}