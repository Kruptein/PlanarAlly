

import { ServerLayer } from "../api_types";

import { Layer } from "./layer";
import { GridLayer } from "./grid";
import { FOWLayer } from "./fow";
import { FOWPlayersLayer } from "./fowplayers";
import gameManager from "../planarally";
import store from "../store";

export function createLayer (layerInfo: ServerLayer) {
    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.style.zIndex = gameManager.layerManager.layers.length.toString();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Create the Layer instance
    let layer: Layer;
    if (layerInfo.grid)
        layer = new GridLayer(canvas, layerInfo.name);
    else if (layerInfo.name === 'fow')
        layer = new FOWLayer(canvas, layerInfo.name);
    else if (layerInfo.name === 'fow-players')
        layer = new FOWPlayersLayer(canvas, layerInfo.name);
    else
        layer = new Layer(canvas, layerInfo.name);
    layer.selectable = layerInfo.selectable;
    layer.player_editable = layerInfo.player_editable
    gameManager.layerManager.addLayer(layer);

    // Add the element to the DOM
    const layers = document.getElementById("layers");
    if (layers === null) {
        console.warn("Layers div is missing, this will prevent the main game board from loading!");
        return;
    }
    layers.appendChild(canvas);

    if (layerInfo.grid && layerInfo.size)
        store.commit("setGridSize", {gridSize: layerInfo.size, sync: false});
    // Load layer shapes
    layer.setShapes(layerInfo.shapes);
}