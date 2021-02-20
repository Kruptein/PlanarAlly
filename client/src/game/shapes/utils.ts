import { InvalidationMode, SyncMode } from "@/core/models/types";
import { baseAdjust, uuidv4 } from "@/core/utils";
import { GlobalPoint, Vector } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
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
    ServerToggleComposite,
} from "@/game/models/shapes";
import { Shape } from "@/game/shapes/shape";
import { Asset } from "@/game/shapes/variants/asset";
import { Circle } from "@/game/shapes/variants/circle";
import { CircularToken } from "@/game/shapes/variants/circulartoken";
import { Line } from "@/game/shapes/variants/line";
import { Rect } from "@/game/shapes/variants/rect";
import { Text } from "@/game/shapes/variants/text";

import { sendRemoveShapes } from "../api/emits/shape/core";
import { EventBus } from "../event-bus";
import { addGroupMembers, createNewGroupForShapes, generateNewBadge, getGroup } from "../groups";
import { floorStore, getFloorId } from "../layers/store";
import { addOperation } from "../operations/undo";
import { gameStore } from "../store";
import { VisibilityMode, visibilityStore } from "../visibility/store";
import { TriangulationTarget } from "../visibility/te/pa";

import { Tracker } from "./interfaces";
import { Polygon } from "./variants/polygon";
import { ToggleComposite } from "./variants/togglecomposite";

// eslint-disable-next-line
export function createShapeFromDict(shape: ServerShape): Shape | undefined {
    let sh: Shape;

    // A fromJSON and toJSON on Shape would be cleaner but ts does not allow for static abstracts so yeah.

    if (shape.group) {
        const group = getGroup(shape.group);
        if (group === undefined) {
            console.log("Missing group info detected");
        } else {
            addGroupMembers(group.uuid, [{ uuid: shape.uuid, badge: shape.badge }], false);
        }
    }

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
            polygon.vertices.map((v) => GlobalPoint.fromArray(v)),
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
        sh = new Text(refPoint, text.text, text.font_size, {
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
    } else if (shape.type_ === "togglecomposite") {
        const toggleComposite = shape as ServerToggleComposite;

        sh = new ToggleComposite(refPoint, toggleComposite.active_variant, toggleComposite.variants, {
            uuid: toggleComposite.uuid,
        });
        gameStore.addOwnedToken(sh.uuid);
    } else {
        return undefined;
    }
    sh.fromDict(shape);
    return sh;
}

export function copyShapes(): void {
    const layer = floorStore.currentLayer;
    if (!layer) return;
    if (!layer.hasSelection({ includeComposites: false })) return;
    const clipboard: ServerShape[] = [];
    for (const shape of layer.getSelection({ includeComposites: true })) {
        if (!shape.ownedBy(false, { editAccess: true })) continue;
        if (!shape.groupId) {
            createNewGroupForShapes([shape.uuid]);
        }
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

    gameStore.setClipboardPosition(gameStore.screenCenter);
    let offset = gameStore.screenCenter.subtract(gameStore.clipboardPosition);
    // Check against 200 as that is the squared length of a vector with size 10, 10
    if (offset.squaredLength() < 200) {
        offset = new Vector(10, 10);
    }

    const shapeMap: Map<string, string> = new Map();
    const composites: ServerToggleComposite[] = [];
    const serverShapes: ServerShape[] = [];

    for (const clip of gameStore.clipboard) {
        clip.x += offset.x;
        clip.y += offset.y;
        const ogUuid = clip.uuid;
        clip.uuid = uuidv4();
        shapeMap.set(ogUuid, clip.uuid);

        if (clip.type_ === "polygon") {
            (clip as ServerPolygon).vertices = (clip as ServerPolygon).vertices.map((p) => [
                p[0] + offset.x,
                p[1] + offset.y,
            ]);
        }

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
        if (clip.group) {
            // We do not need to explicitly join the group as that will be done by createShape below
            // The shape is not yet added to the layerManager at this point anyway
            clip.badge = generateNewBadge(clip.group);
        }
        if (clip.type_ === "togglecomposite") {
            composites.push(clip as ServerToggleComposite);
        } else {
            serverShapes.push(clip);
        }
    }

    for (const composite of composites) {
        composite.active_variant = shapeMap.get(composite.active_variant)!;
        composite.variants = composite.variants.map((v) => ({ ...v, uuid: shapeMap.get(v.uuid)! }));
        serverShapes.push(composite); // make sure it's added after the regular shapes
    }

    // Finalize
    for (const serverShape of serverShapes) {
        const shape = createShapeFromDict(serverShape);
        if (shape === undefined) continue;

        layer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);
        if (!shape.options.has("skipDraw")) layer.pushSelection(shape);
    }

    layer.invalidate(false);
    return layer.getSelection({ includeComposites: false });
}

export function deleteShapes(shapes: readonly Shape[], sync: SyncMode): void {
    const removed: string[] = [];
    const recalculateIterative = visibilityStore.visionMode === VisibilityMode.TRIANGLE_ITERATIVE;
    let recalculateVision = false;
    let recalculateMovement = false;
    for (let i = shapes.length - 1; i >= 0; i--) {
        const sel = shapes[i];
        if (sync !== SyncMode.NO_SYNC && !sel.ownedBy(false, { editAccess: true })) continue;
        removed.push(sel.uuid);
        if (sel.visionObstruction) recalculateVision = true;
        if (sel.movementObstruction) recalculateMovement = true;
        if (sel.layer.removeShape(sel, SyncMode.NO_SYNC, recalculateIterative))
            EventBus.$emit("SelectionInfo.Shapes.Set", []);
    }
    if (sync !== SyncMode.NO_SYNC) sendRemoveShapes({ uuids: removed, temporary: sync === SyncMode.TEMP_SYNC });
    if (!recalculateIterative) {
        if (recalculateMovement)
            visibilityStore.recalculate({ target: TriangulationTarget.MOVEMENT, floor: floorStore.currentFloorindex });
        if (recalculateVision)
            visibilityStore.recalculate({ target: TriangulationTarget.VISION, floor: floorStore.currentFloorindex });
        layerManager.invalidateVisibleFloors();
    }

    if (sync === SyncMode.FULL_SYNC) {
        addOperation({ type: "shaperemove", shapes: shapes.map((s) => s.asDict()) });
    }
}
