import { InvalidationMode, SyncMode } from "@/core/comm/types";
import { ServerFloor, ServerLayer } from "@/game/comm/types/general";
import { GlobalPoint } from "@/game/geom";
import { FOWLayer } from "@/game/layers/fow";
import { FOWPlayersLayer } from "@/game/layers/fowplayers";
import { GridLayer } from "@/game/layers/grid";
import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { Asset } from "@/game/shapes/asset";
import { gameStore } from "@/game/store";
import { clampGridLine, l2gx, l2gy, l2gz } from "@/game/units";
import { visibilityStore } from "@/game/visibility/store";
import { addCDT, removeCDT } from "@/game/visibility/te/pa";
import { gameSettingsStore } from "../settings";

export function addFloor(floor: ServerFloor): void {
    gameStore.floors.push(floor.name);
    addCDT(floor.name);
    layerManager.floors.push({ name: floor.name, layers: [] });
    for (const layer of floor.layers) createLayer(layer, floor.name);
}

export function removeFloor(floor: string): void {
    removeCDT(floor);
    visibilityStore.movementBlockers.splice(
        visibilityStore.movementBlockers.findIndex(mb => mb.floor === floor),
        1,
    );
    visibilityStore.visionBlockers.splice(
        visibilityStore.visionBlockers.findIndex(vb => vb.floor === floor),
        1,
    );
    visibilityStore.visionSources.splice(
        visibilityStore.visionSources.findIndex(vs => vs.floor === floor),
        1,
    );
    const index = gameStore.floors.findIndex(f => f === floor);
    for (const layer of layerManager.floors[index].layers) layer.canvas.remove();
    // todo: once vue 3 hits, fix this split up
    gameStore.floors.splice(index, 1);
    layerManager.floors.splice(index, 1);
    if (gameStore.selectedFloorIndex === index) gameStore.selectFloor({ targetFloor: index - 1, sync: true });
}

export function createLayer(layerInfo: ServerLayer, floor: string): void {
    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.style.zIndex = layerManager.floors.flatMap(f => f.layers).length.toString();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create the Layer instance
    let layer: Layer;
    if (layerInfo.type_ === "grid") layer = new GridLayer(canvas, layerInfo.name, floor);
    else if (layerInfo.type_ === "fow") layer = new FOWLayer(canvas, layerInfo.name, floor);
    else if (layerInfo.type_ === "fow-players") layer = new FOWPlayersLayer(canvas, layerInfo.name, floor);
    else layer = new Layer(canvas, layerInfo.name, floor);
    layer.selectable = layerInfo.selectable;
    layer.playerEditable = layerInfo.player_editable;
    layerManager.addLayer(layer, floor);

    // Add the element to the DOM
    const layers = document.getElementById("layers");
    if (layers === null) {
        console.warn("Layers div is missing, this will prevent the main game board from loading!");
        return;
    }
    if (layerInfo.name !== "fow-players") layers.appendChild(canvas);
    // Load layer shapes
    layer.setShapes(layerInfo.shapes);
}

export function dropAsset(event: DragEvent): void {
    const layer = layerManager.getLayer(layerManager.floor!.name);
    if (layer === undefined || event === null || event.dataTransfer === null) return;
    const image = document.createElement("img");
    image.src = event.dataTransfer.getData("text/plain");
    const asset = new Asset(
        image,
        new GlobalPoint(l2gx(event.clientX), l2gy(event.clientY)),
        l2gz(image.width),
        l2gz(image.height),
    );
    asset.src = new URL(image.src).pathname;

    if (gameSettingsStore.useGrid) {
        const gs = gameSettingsStore.gridSize;
        asset.refPoint = new GlobalPoint(clampGridLine(asset.refPoint.x), clampGridLine(asset.refPoint.y));
        asset.w = Math.max(clampGridLine(asset.w), gs);
        asset.h = Math.max(clampGridLine(asset.h), gs);
    }

    layer.addShape(asset, SyncMode.FULL_SYNC, InvalidationMode.WITH_LIGHT);
}

export function snapToPoint(layer: Layer, endPoint: GlobalPoint, ignore?: GlobalPoint): GlobalPoint {
    const snapDistance = l2gz(20);
    let smallestPoint: [number, GlobalPoint] | undefined;
    for (const point of layer.points.keys()) {
        const gp = GlobalPoint.fromArray(JSON.parse(point));
        if (ignore && gp.equals(ignore)) continue;
        const l = endPoint.subtract(gp).length();

        if (l < (smallestPoint?.[0] ?? snapDistance)) smallestPoint = [l, gp];
    }
    if (smallestPoint !== undefined) endPoint = smallestPoint[1];
    return endPoint;
}
