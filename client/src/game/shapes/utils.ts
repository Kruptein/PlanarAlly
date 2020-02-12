import { InvalidationMode, SyncMode } from "@/core/comm/types";
import { uuidv4 } from "@/core/utils";
import {
    ServerAsset,
    ServerAura,
    ServerCircle,
    ServerCircularToken,
    ServerLine,
    ServerPolygon,
    ServerRect,
    ServerShape,
    ServerText,
} from "@/game/comm/types/shapes";
import { GlobalPoint, LocalPoint, Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { Asset } from "@/game/shapes/asset";
import { Circle } from "@/game/shapes/circle";
import { CircularToken } from "@/game/shapes/circulartoken";
import { Line } from "@/game/shapes/line";
import { Rect } from "@/game/shapes/rect";
import { Shape } from "@/game/shapes/shape";
import { Text } from "@/game/shapes/text";
import { EventBus } from "../event-bus";
import { gameStore } from "../store";
import { g2l, g2lz } from "../units";
import { circleLineIntersection, xyEqual } from "../visibility/te/triag";
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
    } else if (shape.type_ === "polygon") {
        const polygon = <ServerPolygon>shape;
        sh = new Polygon(
            refPoint,
            polygon.vertices.map(v => new GlobalPoint(v.x, v.y)),
            polygon.fill_colour,
            polygon.stroke_colour,
            polygon.line_width,
            polygon.open_polygon,
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
            layerManager.getLayer(shape.floor, shape.layer)!.invalidate(true);
        };
    } else {
        return undefined;
    }
    sh.fromDict(shape);
    return sh;
}

export function copyShapes(): void {
    const layer = layerManager.getLayer(layerManager.floor!.name);
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
    const layer = layerManager.getLayer(layerManager.floor!.name, targetLayer);
    if (!layer) return [];
    if (!gameStore.clipboard) return [];
    layer.selection = [];
    let offset = gameStore.screenCenter.subtract(gameStore.clipboardPosition);
    gameStore.setClipboardPosition(gameStore.screenCenter);
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
        layer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);
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
    const l = layerManager.getLayer(layerManager.floor!.name)!;
    for (let i = l.selection.length - 1; i >= 0; i--) {
        const sel = l.selection[i];
        if (gameStore.selectionHelperID === sel.uuid) {
            l.selection.splice(i, 1);
            continue;
        }
        l.removeShape(sel, SyncMode.FULL_SYNC);
        EventBus.$emit("SelectionInfo.Shape.Set", null);
        EventBus.$emit("Initiative.Remove", sel.uuid);
    }
}

export function cutShapes(): void {
    copyShapes();
    deleteShapes();
}

export function updateAuraPath(visibilityPolygon: number[][], center: GlobalPoint, aura: number): Path2D {
    const auraCircle = new Circle(center, aura);
    const path = new Path2D();
    const lCenter = g2l(auraCircle.center());
    const lRadius = g2lz(auraCircle.r);
    let firstAngle: number | null = null;
    let lastAngle: number | null = null;

    const ixs: LocalPoint[][] = [];

    // First find all polygon segments that are actually relevant
    for (const [i, p] of visibilityPolygon.map(p => GlobalPoint.fromArray(p)).entries()) {
        const np = GlobalPoint.fromArray(visibilityPolygon[(i + 1) % visibilityPolygon.length]);
        const pLoc = g2l(p);
        const npLoc = g2l(np);
        const ix = circleLineIntersection(auraCircle.center(), auraCircle.r, p, np).map(x => g2l(x));
        if (ix.length === 0) {
            // segment lies completely outside circle
            if (!auraCircle.contains(p)) continue;
            // segment lies completely inside circle
            else ix.push(pLoc, npLoc);
        } else if (ix.length === 1) {
            // segment is tangent to circle, segment can be ignored
            if (xyEqual(ix[0].asArray(), pLoc.asArray()) || xyEqual(ix[0].asArray(), npLoc.asArray())) continue;
            if (auraCircle.contains(p)) {
                ix.unshift(pLoc);
            } else {
                ix.push(npLoc);
            }
        }
        // Check some bad cases
        if (ixs.length > 0) {
            const lastIx = ixs[ixs.length - 1];
            if (xyEqual(lastIx[0].asArray(), ix[1].asArray()) && xyEqual(lastIx[1].asArray(), ix[0].asArray()))
                continue;
            if (xyEqual(lastIx[0].asArray(), ix[0].asArray()) && xyEqual(lastIx[1].asArray(), ix[1].asArray()))
                continue;
        }
        ixs.push(ix);
    }

    if (ixs.length < 1) {
        path.arc(lCenter.x, lCenter.y, lRadius, 0, 2 * Math.PI);
        return path;
    }

    // If enough interesting edges have been found, cut the circle up.
    for (const ix of ixs) {
        const circleHitAngle = Math.atan2(ix[0].y - lCenter.y, ix[0].x - lCenter.x);
        if (lastAngle === null) {
            path.moveTo(ix[0].x, ix[0].y);
            firstAngle = Math.atan2(ix[0].y - lCenter.y, ix[0].x - lCenter.x);
        } else if (lastAngle !== circleHitAngle) {
            path.arc(lCenter.x, lCenter.y, lRadius, lastAngle, circleHitAngle);
        }
        lastAngle = Math.atan2(ix[1].y - lCenter.y, ix[1].x - lCenter.x);
        path.lineTo(ix[1].x, ix[1].y);
    }
    if (firstAngle && lastAngle) {
        if (firstAngle !== lastAngle) path.arc(lCenter.x, lCenter.y, lRadius, lastAngle, firstAngle);
    } else path.arc(lCenter.x, lCenter.y, lRadius, 0, 2 * Math.PI);

    return path;
}
