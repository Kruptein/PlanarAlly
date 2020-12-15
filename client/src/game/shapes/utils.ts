import { InvalidationMode, SyncMode } from "@/core/comm/types";
import { baseAdjust, uuidv4 } from "@/core/utils";
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
import { GlobalPoint, Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";
import { Asset } from "@/game/shapes/variants/asset";
import { Circle } from "@/game/shapes/variants/circle";
import { CircularToken } from "@/game/shapes/variants/circulartoken";
import { Line } from "@/game/shapes/variants/line";
import { Rect } from "@/game/shapes/variants/rect";
import { Text } from "@/game/shapes/variants/text";
import { EventBus } from "../event-bus";
import { floorStore, getFloorId } from "../layers/store";
import { gameStore } from "../store";
import { Tracker } from "./interfaces";
import { Polygon } from "./variants/polygon";

export function createShapeFromDict(shape: ServerShape): Shape | undefined {
    let sh: Shape;

    // A fromJSON and toJSON on Shape would be cleaner but ts does not allow for static abstracts so yeah.

    // Shape Type specifics

    const refPoint = new GlobalPoint(shape.x, shape.y);
    if (shape.type_ === "rect") {
        const rect = shape as ServerRect;
        sh = new Rect(refPoint, rect.width, rect.height, {
            fillColour: rect.fill_colour,
            strokeColour: rect.stroke_colour,
            uuid: rect.uuid,
        });
    } else if (shape.type_ === "circle") {
        const circ = shape as ServerCircle;
        sh = new Circle(refPoint, circ.radius, {
            fillColour: circ.fill_colour,
            strokeColour: circ.stroke_colour,
            uuid: circ.uuid,
        });
    } else if (shape.type_ === "circulartoken") {
        const token = shape as ServerCircularToken;
        sh = new CircularToken(refPoint, token.radius, token.text, token.font, {
            fillColour: token.fill_colour,
            strokeColour: token.stroke_colour,
            uuid: token.uuid,
        });
    } else if (shape.type_ === "line") {
        const line = shape as ServerLine;
        sh = new Line(refPoint, new GlobalPoint(line.x2, line.y2), {
            lineWidth: line.line_width,
            strokeColour: line.stroke_colour,
            uuid: line.uuid,
        });
    } else if (shape.type_ === "polygon") {
        const polygon = shape as ServerPolygon;
        sh = new Polygon(
            refPoint,
            polygon.vertices.map(v => GlobalPoint.fromArray(v)),
            {
                fillColour: polygon.fill_colour,
                strokeColour: polygon.stroke_colour,
                lineWidth: polygon.line_width,
                openPolygon: polygon.open_polygon,
                uuid: polygon.uuid,
            },
        );
    } else if (shape.type_ === "text") {
        const text = shape as ServerText;
        sh = new Text(refPoint, text.text, text.font, {
            fillColour: text.fill_colour,
            strokeColour: text.stroke_colour,
            uuid: text.uuid,
        });
    } else if (shape.type_ === "assetrect") {
        const asset = shape as ServerAsset;
        const img = new Image(asset.width, asset.height);
        if (asset.src.startsWith("http")) img.src = baseAdjust(new URL(asset.src).pathname);
        else img.src = baseAdjust(asset.src);
        sh = new Asset(img, refPoint, asset.width, asset.height, { uuid: asset.uuid });
        img.onload = () => {
            layerManager.getLayer(layerManager.getFloor(getFloorId(shape.floor))!, shape.layer)!.invalidate(true);
        };
    } else {
        return undefined;
    }
    sh.fromDict(shape);
    return sh;
}

export function copyShapes(): void {
    const layer = floorStore.currentLayer;
    if (!layer) return;
    if (!layer.hasSelection()) return;
    const clipboard: ServerShape[] = [];
    for (const shape of layer.getSelection()) {
        if (!shape.ownedBy({ editAccess: true })) continue;
        clipboard.push(shape.asDict());
    }
    gameStore.setClipboard(clipboard);
    gameStore.setClipboardPosition(gameStore.screenCenter);
}

export function pasteShapes(targetLayer?: string): readonly Shape[] {
    const layer = layerManager.getLayer(floorStore.currentFloor, targetLayer);
    if (!layer) return [];
    if (!gameStore.clipboard) return [];
    layer.setSelection();
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
        // Trackers
        const oldTrackers = clip.trackers;
        clip.trackers = [];
        for (const tracker of oldTrackers) {
            const newTracker: Tracker = {
                ...tracker,
                uuid: uuidv4(),
            };
            clip.trackers.push(newTracker);
        }
        // Auras
        const oldAuras = clip.auras;
        clip.auras = [];
        for (const aura of oldAuras) {
            const newAura: ServerAura = {
                ...aura,
                uuid: uuidv4(),
            };
            clip.auras.push(newAura);
        }
        // Badge
        // Finalize
        const shape = createShapeFromDict(clip);
        if (shape === undefined) continue;
        layer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);
        layer.pushSelection(shape);
    }
    layer.invalidate(false);
    return layer.getSelection();
}

// todo: refactor with removeShape in api/events/shape
export function deleteShapes(): void {
    if (floorStore.currentLayer === undefined) {
        console.log("No active layer selected for delete operation");
        return;
    }
    const l = floorStore.currentLayer!;
    for (let i = l.getSelection().length - 1; i >= 0; i--) {
        const sel = l.getSelection()[i];
        if (!sel.ownedBy({ editAccess: true })) continue;
        if (l.removeShape(sel, SyncMode.FULL_SYNC)) EventBus.$emit("SelectionInfo.Shapes.Set", []);
    }
    l.setSelection();
}

export function cutShapes(): void {
    copyShapes();
    deleteShapes();
}
