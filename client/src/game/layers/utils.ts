import { ServerLayer } from "@/game/comm/types/general";
import { FOWLayer } from "@/game/layers/fow";
import { FOWPlayersLayer } from "@/game/layers/fowplayers";
import { GridLayer } from "@/game/layers/grid";
import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { GlobalPoint } from '../geom';
import { Asset } from '../shapes/asset';
import { l2gx, l2gy, l2gz } from '../units';

export function createLayer(layerInfo: ServerLayer) {
    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.style.zIndex = layerManager.layers.length.toString();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create the Layer instance
    let layer: Layer;
    if (layerInfo.type_ === "grid") layer = new GridLayer(canvas, layerInfo.name);
    else if (layerInfo.type_ === "fow") layer = new FOWLayer(canvas, layerInfo.name);
    else if (layerInfo.type_ === "fow-players") layer = new FOWPlayersLayer(canvas, layerInfo.name);
    else layer = new Layer(canvas, layerInfo.name);
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

export function dropAsset(event: DragEvent) {
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

    layer.addShape(asset, true);
}