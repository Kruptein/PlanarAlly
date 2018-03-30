import gameManager from "../planarally";
import Rect from "./rect";
import Circle from "./circle";
import Line from "./line";
import Text from "./text";
import Asset from "./asset";
import { ServerShape } from "../api_types";

export function createShapeFromDict(shape: ServerShape, dummy?: boolean) {
    if (dummy === undefined) dummy = false;
    if (!dummy && gameManager.layerManager.UUIDMap.has(shape.uuid))
        return gameManager.layerManager.UUIDMap.get(shape.uuid);

    let sh;

    if (shape.type === 'rect') sh = Object.assign(new Rect(), shape);
    if (shape.type === 'circle') sh = Object.assign(new Circle(), shape);
    if (shape.type === 'line') sh = Object.assign(new Line(), shape);
    if (shape.type === 'text') sh = Object.assign(new Text(), shape);
    if (shape.type === 'asset') {
        const img = new Image(shape.w, shape.h);
        img.src = shape.src;
        sh = Object.assign(new Asset(), shape);
        sh.img = img;
        img.onload = function () {
            gameManager.layerManager.getLayer(shape.layer)!.invalidate(false);
        };
    }
    return sh;
}