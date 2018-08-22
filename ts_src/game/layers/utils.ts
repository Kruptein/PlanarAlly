

import { ServerLayer } from "../api_types";

import { Layer } from "./layer";
import { GridLayer } from "./grid";
import { FOWLayer } from "./fow";
import { FOWPlayersLayer } from "./fowplayers";
import gameManager from "../planarally";
import store from "../store";

export function createLayer (layerInfo: ServerLayer) {
    // // UI changes
    // if (!(layer.name === 'fow-players' && Settings.IS_DM))
    //     layersdiv.append("<canvas id='" + layer.name + "-layer' style='z-index: " + this.layers.length + "'></canvas>");
    // if (layer.selectable) {
    //     const layerselectdiv = $("#layerselect");
    //     let extra = '';
    //     if (!this.layers.some(l => l.selectable)) extra = " class='layer-selected'";
    //     layerselectdiv.find('ul')!.append("<li id='select-" + layer.name + "'" + extra + "><a href='#'>" + capitalize(layer.name) + "</a></li>");
    // }
    // let canvas;
    // if (layer.name === 'fow-players') {
    //     canvas = document.createElement("canvas");
    // } else {
    //     canvas = <HTMLCanvasElement>$('#' + layer.name + '-layer')[0];
    // }

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

    if (layerInfo.grid)
        store.commit("setGridSize", {size: layerInfo.size, sync: false});

    // Load layer shapes
    layer.setShapes(layerInfo.shapes);
}