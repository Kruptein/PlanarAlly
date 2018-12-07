import { ServerLayer } from "@/game/comm/types/general";
import { FOWLayer } from "@/game/layers/fow";
import { FOWPlayersLayer } from "@/game/layers/fowplayers";
import { GridLayer } from "@/game/layers/grid";
import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";

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
