import gameManager from "../planarally";
import Rect from "./rect";
import Circle from "./circle";
import Line from "./line";
import Text from "./text";
import Asset from "./asset";
import { GlobalPoint } from "../geom";
import CircularToken from "./circulartoken";
import MultiLine from "./multiline";
export function createShapeFromDict(shape, dummy) {
    // TODO: is this dummy stuff actually needed, do we ever want to return the local shape?
    if (dummy === undefined)
        dummy = false;
    if (!dummy && gameManager.layerManager.UUIDMap.has(shape.uuid))
        return gameManager.layerManager.UUIDMap.get(shape.uuid);
    let sh;
    // A fromJSON and toJSON on Shape would be cleaner but ts does not allow for static abstracts so yeah.
    const refPoint = new GlobalPoint(shape.x, shape.y);
    if (shape.type === 'rect') {
        const rect = shape;
        sh = new Rect(refPoint, rect.w, rect.h, rect.fill, rect.border, rect.uuid);
    }
    else if (shape.type === 'circle') {
        const circ = shape;
        sh = new Circle(refPoint, circ.r, circ.fill, circ.border, circ.uuid);
    }
    else if (shape.type === 'circulartoken') {
        const token = shape;
        sh = new CircularToken(refPoint, token.r, token.text, token.font, token.fill, token.border, token.uuid);
    }
    else if (shape.type === 'line') {
        const line = shape;
        sh = new Line(refPoint, new GlobalPoint(line.x2, line.y2), line.lineWidth, line.uuid);
    }
    else if (shape.type === 'multiline') {
        const multiline = shape;
        sh = new MultiLine(refPoint, multiline.points.map((p) => new GlobalPoint(p.x, p.y)), multiline.size, multiline.fill, multiline.uuid);
    }
    else if (shape.type === 'text') {
        const text = shape;
        sh = new Text(refPoint, text.text, text.font, text.angle, text.fill, text.uuid);
    }
    else if (shape.type === 'asset') {
        const asset = shape;
        const img = new Image(asset.w, asset.h);
        if (asset.src.startsWith("http"))
            img.src = new URL(asset.src).pathname;
        else
            img.src = asset.src;
        sh = new Asset(img, refPoint, asset.w, asset.h, asset.uuid);
        img.onload = function () {
            gameManager.layerManager.getLayer(shape.layer).invalidate(false);
        };
    }
    else {
        return undefined;
    }
    sh.fromDict(shape);
    return sh;
}
//# sourceMappingURL=utils.js.map