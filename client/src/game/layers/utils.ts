import { ServerLayer } from "@/game/comm/types/general";
import { FOWLayer } from "@/game/layers/fow";
import { FOWPlayersLayer } from "@/game/layers/fowplayers";
import { GridLayer } from "@/game/layers/grid";
import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { GlobalPoint, LocalPoint } from "../geom";
import { Asset } from "../shapes/asset";
import { l2gx, l2gy, l2gz, g2l } from "../units";
import { SyncMode } from "@/core/comm/types";

export function createLayer(layerInfo: ServerLayer, floor: string): void {
    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.style.zIndex = layerManager.layers.length.toString();
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
    layerManager.addLayer(layer);

    // Add the element to the DOM
    const layers = document.getElementById("layers");
    if (layers === null) {
        console.warn("Layers div is missing, this will prevent the main game board from loading!");
        return;
    }
    if (layerInfo.name !== "fow-players") layers.appendChild(canvas);

    if (layerInfo.type_ === "grid" && layerInfo.size) gameStore.setGridSize({ gridSize: layerInfo.size, sync: false });
    // Load layer shapes
    layer.setShapes(layerInfo.shapes);
}

export function dropAsset(event: DragEvent): void {
    const layer = layerManager.getLayer();
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

    if (gameStore.useGrid) {
        const gs = gameStore.gridSize;
        asset.refPoint = new GlobalPoint(
            Math.round(asset.refPoint.x / gs) * gs,
            Math.round(asset.refPoint.y / gs) * gs,
        );
        asset.w = Math.max(Math.round(asset.w / gs) * gs, gs);
        asset.h = Math.max(Math.round(asset.h / gs) * gs, gs);
    }

    layer.addShape(asset, SyncMode.FULL_SYNC);
}

export function snapToPoint(layer: Layer, endPoint: GlobalPoint): GlobalPoint {
    const snapDistance = l2gz(20);
    let smallestPoint: [number, GlobalPoint] | undefined;
    for (const point of layer.points.keys()) {
        const gp = GlobalPoint.fromArray(JSON.parse(point));
        const l = endPoint.subtract(gp).length();
        if (smallestPoint === undefined && l < snapDistance) smallestPoint = [l, gp];
        else if (smallestPoint !== undefined && l < smallestPoint[0]) smallestPoint = [l, gp];
    }
    if (smallestPoint !== undefined) endPoint = smallestPoint[1];
    return endPoint;
}

export function snapToPointLocal(layer: Layer, endPoint: LocalPoint): LocalPoint {
    const snapDistance = 20;
    let smallestPoint: [number, LocalPoint] | undefined;
    for (const point of layer.points.keys()) {
        const lp = g2l(GlobalPoint.fromArray(JSON.parse(point)));
        const l = endPoint.subtract(lp).length();
        if (smallestPoint === undefined && l < snapDistance) smallestPoint = [l, lp];
        else if (smallestPoint !== undefined && l < smallestPoint[0]) smallestPoint = [l, lp];
    }
    if (smallestPoint !== undefined) endPoint = smallestPoint[1];
    return endPoint;
}
