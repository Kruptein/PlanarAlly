import { InvalidationMode, SyncMode } from "@/core/models/types";
import { GlobalPoint, Vector } from "@/game/geom";
import { FowLightingLayer } from "@/game/layers/fowlighting";
import { FowVisionLayer } from "@/game/layers/fowvision";
import { GridLayer } from "@/game/layers/grid";
import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { ServerFloor, ServerLayer } from "@/game/models/general";
import { Asset } from "@/game/shapes/variants/asset";
import { clampGridLine, l2gx, l2gy, l2gz } from "@/game/units";
import { visibilityStore } from "@/game/visibility/store";
import { addCDT, removeCDT } from "@/game/visibility/te/pa";

import { baseAdjust, uuidv4 } from "../../core/utils";
import i18n from "../../i18n";
import { requestAssetOptions } from "../api/emits/asset";
import { sendFloorChange, sendLayerChange } from "../api/emits/shape/core";
import { addNewGroup, hasGroup } from "../groups";
import { groupToClient } from "../models/groups";
import { BaseTemplate } from "../models/templates";
import { addOperation } from "../operations/undo";
import { gameSettingsStore } from "../settings";
import { Shape } from "../shapes/shape";
import { applyTemplate } from "../shapes/template";
import { DEFAULT_GRID_SIZE } from "../store";

import { Floor } from "./floor";
import { floorStore, getFloorId, newFloorId } from "./store";

export async function addFloor(serverFloor: ServerFloor): Promise<void> {
    const floor: Floor = {
        id: newFloorId(),
        name: serverFloor.name,
        playerVisible: serverFloor.player_visible,
    };
    floorStore.addFloor({ floor, targetIndex: serverFloor.index });
    addCDT(getFloorId(serverFloor.name));
    for (const layer of serverFloor.layers) await createLayer(layer, floor);
    visibilityStore.recalculateVision(getFloorId(floor.name));
    visibilityStore.recalculateMovement(getFloorId(floor.name));

    recalculateZIndices();
}

function recalculateZIndices(): void {
    let i = 0;
    for (const floor of floorStore.floors) {
        for (const layer of layerManager.getLayers(floor)) {
            layer.canvas.style.zIndex = `${i}`;
            i += 1;
        }
    }
}

export function removeFloor(floorId: number): void {
    removeCDT(floorId);
    visibilityStore.movementBlockers.splice(
        visibilityStore.movementBlockers.findIndex((mb) => mb.floor === floorId),
        1,
    );
    visibilityStore.visionBlockers.splice(
        visibilityStore.visionBlockers.findIndex((vb) => vb.floor === floorId),
        1,
    );
    visibilityStore.visionSources.splice(
        visibilityStore.visionSources.findIndex((vs) => vs.floor === floorId),
        1,
    );
    const floor = floorStore.floors.find((f) => f.id === floorId)!;
    for (const layer of layerManager.getLayers(floor)) layer.canvas.remove();
    floorStore.removeFloor(floor);
}

async function createLayer(layerInfo: ServerLayer, floor: Floor): Promise<void> {
    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create the Layer instance
    let layer: Layer;
    if (layerInfo.type_ === "grid") layer = new GridLayer(canvas, layerInfo.name, floor.id, layerInfo.index);
    else if (layerInfo.type_ === "fow") layer = new FowLightingLayer(canvas, layerInfo.name, floor.id, layerInfo.index);
    else if (layerInfo.type_ === "fow-players")
        layer = new FowVisionLayer(canvas, layerInfo.name, floor.id, layerInfo.index);
    else layer = new Layer(canvas, layerInfo.name, floor.id, layerInfo.index);
    layer.selectable = layerInfo.selectable;
    layer.playerEditable = layerInfo.player_editable;
    layerManager.addLayer(layer, floor.id);

    // Add the element to the DOM
    const layers = document.getElementById("layers");
    if (layers === null) {
        console.warn("Layers div is missing, this will prevent the main game board from loading!");
        return;
    }
    if (layerInfo.name !== "fow-players") layers.appendChild(canvas);

    // Load layer groups

    for (const serverGroup of layerInfo.groups) {
        const group = groupToClient(serverGroup);
        if (!hasGroup(group.uuid)) {
            addNewGroup(group, false);
        }
    }

    // Load layer shapes
    await layer.setServerShapes(layerInfo.shapes);
}

export async function dropAsset(
    data: { imageSource: string; assetId: number },
    position: { x: number; y: number },
    selectionBox: { open: (title: string, choices: string[]) => Promise<string | undefined> },
): Promise<Asset | undefined> {
    const layer = floorStore.currentLayer;

    let options: BaseTemplate | undefined;
    if (data.assetId) {
        const response = await requestAssetOptions(data.assetId);
        if (response.success) {
            const choices = Object.keys(response.options?.templates ?? {});
            if (choices.length > 0) {
                try {
                    const choice = await selectionBox.open(i18n.t("game.ui.templates.choose").toString(), choices);
                    if (choice === undefined) return;
                    options = response.options!.templates[choice];
                } catch {
                    // no-op ; action cancelled
                }
            }
        }
    }

    if (!data.imageSource.startsWith("/static")) return;
    const image = document.createElement("img");
    const uuid = uuidv4();
    image.src = baseAdjust(data.imageSource);

    return new Promise((resolve) => {
        image.onload = () => {
            const refPoint = new GlobalPoint(l2gx(position.x), l2gy(position.y));
            const asset = new Asset(image, refPoint, l2gz(image.width), l2gz(image.height), {
                assetId: data.assetId,
                uuid,
            });
            asset.src = new URL(image.src).pathname;

            if (options) {
                asset.setLayer(layer.floor, layer.name); // if we don't set this the asDict will fail
                asset.fromDict(applyTemplate(asset.asDict(), options));
            }

            if (gameSettingsStore.useGrid) {
                asset.refPoint = new GlobalPoint(clampGridLine(asset.refPoint.x), clampGridLine(asset.refPoint.y));
            }

            layer.addShape(asset, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);

            resolve(asset);
        };
    });
}

export function snapToPoint(layer: Layer, endPoint: GlobalPoint, ignore?: GlobalPoint): [GlobalPoint, boolean] {
    const snapDistance = l2gz(20);
    let smallestPoint: [number, GlobalPoint] | undefined;
    for (const point of layer.points.keys()) {
        const gp = GlobalPoint.fromArray(JSON.parse(point));
        if (ignore && gp.equals(ignore)) continue;
        const l = endPoint.subtract(gp).length();

        if (l < (smallestPoint?.[0] ?? snapDistance)) smallestPoint = [l, gp];
    }
    if (smallestPoint !== undefined) endPoint = smallestPoint[1];
    return [endPoint, smallestPoint !== undefined];
}

export function snapToGridPoint(point: GlobalPoint): [GlobalPoint, boolean] {
    let smallestPoint: [number, GlobalPoint] | undefined;
    const reverseOriginVector = new Vector(
        Math.floor(point.x / DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE,
        Math.floor(point.y / DEFAULT_GRID_SIZE) * DEFAULT_GRID_SIZE,
    );
    let originShifted = new GlobalPoint(point.x % DEFAULT_GRID_SIZE, point.y % DEFAULT_GRID_SIZE);
    if (originShifted.x < 0) originShifted = originShifted.add(new Vector(DEFAULT_GRID_SIZE, 0));
    if (originShifted.y < 0) originShifted = originShifted.add(new Vector(0, DEFAULT_GRID_SIZE));

    const targets = [
        new GlobalPoint(0, 0),
        new GlobalPoint(0, DEFAULT_GRID_SIZE),
        new GlobalPoint(DEFAULT_GRID_SIZE, 0),
        new GlobalPoint(DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE),
        new GlobalPoint(0, DEFAULT_GRID_SIZE / 2),
        new GlobalPoint(DEFAULT_GRID_SIZE / 2, 0),
        new GlobalPoint(DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE / 2),
        new GlobalPoint(DEFAULT_GRID_SIZE / 2, DEFAULT_GRID_SIZE),
        new GlobalPoint(DEFAULT_GRID_SIZE / 2, DEFAULT_GRID_SIZE / 2),
    ];
    for (const target of targets) {
        const l = originShifted.subtract(target).length();

        if (l < (smallestPoint?.[0] ?? Number.MAX_VALUE)) smallestPoint = [l, target];
    }
    if (smallestPoint !== undefined) return [smallestPoint[1].add(reverseOriginVector), true];
    return [point, false];
}

export function moveFloor(shapes: Shape[], newFloor: Floor, sync: boolean): void {
    if (shapes.length === 0) return;
    const oldLayer = shapes[0].layer;
    const oldFloor = shapes[0].floor;
    if (shapes.some((s) => s.layer !== oldLayer)) {
        throw new Error("Mixing shapes from different floors in shape move");
    }

    const newLayer = layerManager.getLayer(newFloor, oldLayer.name)!;
    for (const shape of shapes) {
        visibilityStore.moveShape({ shape, oldFloor: oldFloor.id, newFloor: newFloor.id });
        shape.setLayer(newFloor.id, oldLayer.name);
    }
    oldLayer.setShapes(...oldLayer.getShapes({ includeComposites: true }).filter((s) => !shapes.includes(s)));
    newLayer.pushShapes(...shapes);
    oldLayer.invalidate(false);
    newLayer.invalidate(false);
    if (sync) {
        const uuids = shapes.map((s) => s.uuid);
        sendFloorChange({ uuids, floor: newFloor.name });
        addOperation({ type: "floormovement", shapes: uuids, from: oldFloor.id, to: newFloor.id });
    }
}

export function moveLayer(shapes: readonly Shape[], newLayer: Layer, sync: boolean): void {
    if (shapes.length === 0) return;
    const oldLayer = shapes[0].layer;

    if (shapes.some((s) => s.layer !== oldLayer)) {
        throw new Error("Mixing shapes from different floors in shape move");
    }

    for (const shape of shapes) shape.setLayer(newLayer.floor, newLayer.name);
    // Update layer shapes
    oldLayer.setShapes(...oldLayer.getShapes({ includeComposites: true }).filter((s) => !shapes.includes(s)));
    newLayer.pushShapes(...shapes);
    // Revalidate layers  (light should at most be redone once)
    oldLayer.invalidate(true);
    newLayer.invalidate(false);
    // Sync!
    if (sync) {
        const uuids = shapes.map((s) => s.uuid);
        sendLayerChange({
            uuids,
            layer: newLayer.name,
            floor: layerManager.getFloor(newLayer.floor)!.name,
        });
        addOperation({ type: "layermovement", shapes: uuids, from: oldLayer.name, to: newLayer.name });
    }
}

export function addAllCompositeShapes(shapes: readonly Shape[]): readonly Shape[] {
    const shapeUuids: Set<string> = new Set(shapes.map((s) => s.uuid));
    const allShapes = [...shapes];
    for (const shape of layerManager.getComposites()) {
        if (shapes.some((s) => s.uuid === shape)) {
            const parent = layerManager.getCompositeParent(shape)!;
            if (shapeUuids.has(parent.uuid)) continue;
            shapeUuids.add(parent.uuid);
            allShapes.push(parent);
            for (const variant of parent.variants) {
                if (shapeUuids.has(variant.uuid)) {
                    continue;
                } else {
                    shapeUuids.add(variant.uuid);
                    allShapes.push(layerManager.UUIDMap.get(variant.uuid)!);
                }
            }
        }
    }
    return allShapes;
}
