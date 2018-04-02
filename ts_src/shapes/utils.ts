import gameManager from "../planarally";
import Rect from "./rect";
import Circle from "./circle";
import Line from "./line";
import Text from "./text";
import Asset from "./asset";
import { ServerShape, ServerRect, ServerCircle, ServerLine, ServerText, ServerAsset } from "../api_types";
import Shape from "./shape";

export function createShapeFromDict(shape: ServerShape, dummy?: boolean) {
    // todo is this dummy stuff actually needed, do we ever want to return the local shape?
    if (dummy === undefined) dummy = false;
    if (!dummy && gameManager.layerManager.UUIDMap.has(shape.uuid))
        return gameManager.layerManager.UUIDMap.get(shape.uuid);

    let sh: Shape;

    // A fromJSON and toJSON on Shape would be cleaner but ts does not allow for static abstracts so yeah.

    if (shape.type === 'rect') {
        const rect = <ServerRect>shape;
        sh = new Rect(rect.refPoint, rect.w, rect.h, rect.fill, rect.border, rect.uuid);
        Object.assign(sh, shape);
    } else if (shape.type === 'circle') {
        const circ = <ServerCircle>shape;
        sh = new Circle(circ.refPoint, circ.r, circ.fill, circ.border, circ.uuid);
        Object.assign(sh, shape);
    } else if (shape.type === 'line') {
        const line = <ServerLine>shape;
        sh = new Line(line.refPoint, line.endPoint);
        Object.assign(sh, shape);
    } else if (shape.type === 'text') {
        const text = <ServerText>shape;
        sh = new Text(text.refPoint, text.text, text.font, text.angle, text.uuid);
        Object.assign(sh, shape);
    } else if (shape.type === 'asset') {
        const asset = <ServerAsset>shape;
        const img = new Image(asset.w, asset.h);
        if (asset.src.startsWith("http"))
            img.src = new URL(asset.src).pathname;
        else
            img.src = asset.src
        sh = new Asset(img, asset.refPoint, asset.w, asset.h, asset.uuid);
        Object.assign(sh, shape);
        img.onload = function () {
            gameManager.layerManager.getLayer(shape.layer)!.invalidate(false);
        };
    } else {
        return undefined;
    }
    return sh;
}