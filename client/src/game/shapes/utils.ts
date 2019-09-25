import { uuidv4 } from "@/core/utils";
import {
    ServerAsset,
    ServerAura,
    ServerCircle,
    ServerCircularToken,
    ServerLine,
    ServerMultiLine,
    ServerPolygon,
    ServerRect,
    ServerShape,
    ServerText,
} from "@/game/comm/types/shapes";
import { GlobalPoint, Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { Asset } from "@/game/shapes/asset";
import { Circle } from "@/game/shapes/circle";
import { CircularToken } from "@/game/shapes/circulartoken";
import { Line } from "@/game/shapes/line";
import { MultiLine } from "@/game/shapes/multiline";
import { Rect } from "@/game/shapes/rect";
import { Shape } from "@/game/shapes/shape";
import { Text } from "@/game/shapes/text";
import { EventBus } from "../event-bus";
import { gameStore } from "../store";
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

export function copyShapes(): void {
    const layer = layerManager.getLayer();
    if (!layer) return;
    if (!layer.selection) return;
    const clipboard = [];
    for (const shape of layer.selection) {
        if (gameStore.selectionHelperID === shape.uuid) continue;
        clipboard.push(shape.asDict());
    }
    gameStore.setClipboard(clipboard);
    gameStore.setClipboardPosition(gameStore.screenCenter);
}

export function pasteShapes(targetLayer?: string): Shape[] {
    const layer = layerManager.getLayer(targetLayer);
    if (!layer) return [];
    if (!gameStore.clipboard) return [];
    layer.selection = [];
    let offset = gameStore.screenCenter.subtract(gameStore.clipboardPosition);
    // Check against 200 as that is the squared length of a vector with size 10, 10
    if (offset.squaredLength() < 200) {
        offset = new Vector(10, 10);
    }
    for (const clip of gameStore.clipboard) {
        clip.x += offset.x;
        clip.y += offset.y;
        clip.uuid = uuidv4();
        const oldTrackers = clip.trackers;
        clip.trackers = [];
        for (const tracker of oldTrackers) {
            const newTracker: Tracker = {
                ...tracker,
                uuid: uuidv4(),
            };
            clip.trackers.push(newTracker);
        }
        const oldAuras = clip.auras;
        clip.auras = [];
        for (const aura of oldAuras) {
            const newAura: ServerAura = {
                ...aura,
                uuid: uuidv4(),
            };
            clip.auras.push(newAura);
        }
        const shape = createShapeFromDict(clip);
        if (shape === undefined) continue;
        layer.addShape(shape, true);
        layer.selection.push(shape);
    }
    if (layer.selection.length === 1) EventBus.$emit("SelectionInfo.Shape.Set", layer.selection[0]);
    else EventBus.$emit("SelectionInfo.Shape.Set", null);
    layer.invalidate(false);
    return layer.selection;
}

export function deleteShapes(): void {
    if (layerManager.getLayer === undefined) {
        console.log("No active layer selected for delete operation");
        return;
    }
    const l = layerManager.getLayer()!;
    for (let i = l.selection.length - 1; i >= 0; i--) {
        const sel = l.selection[i];
        if (gameStore.selectionHelperID === sel.uuid) {
            l.selection.splice(i, 1);
            continue;
        }
        l.removeShape(sel, true, false);
        EventBus.$emit("SelectionInfo.Shape.Set", null);
        EventBus.$emit("Initiative.Remove", sel.uuid);
    }
}

export function cutShapes(): void {
    copyShapes();
    deleteShapes();
}
