import { Layer } from "./layer";
import { GridLayer } from "./grid";
import gameManager from "../planarally";
import { capitalize } from "../../core/utils";
import { FOWLayer } from "./fow";
import { LocalPoint } from "../geom";
import { l2g } from "../units";
import Asset from "../shapes/asset";
import { FOWPlayersLayer } from "./fowplayers";
import store from "../store";
export class LayerManager {
    constructor() {
        this.layers = [];
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.UUIDMap = new Map();
        // Refresh interval and redraw setter.
        this.interval = 30;
        const lm = this;
        setInterval(function () {
            for (let i = lm.layers.length - 1; i >= 0; i--) {
                lm.layers[i].draw();
            }
        }, this.interval);
    }
    setWidth(width) {
        this.width = width;
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].canvas.width = width;
            this.layers[i].width = width;
        }
    }
    setHeight(height) {
        this.height = height;
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].canvas.height = height;
            this.layers[i].height = height;
        }
    }
    addLayer(layer) {
        this.layers.push(layer);
        if (layer.selectable)
            store.commit("addLayer", layer.name);
    }
    hasLayer(name) {
        return this.layers.some(l => l.name === name);
    }
    getLayer(name) {
        name = (name === undefined) ? store.getters.selectedLayer : name;
        for (let i = 0; i < this.layers.length; i++) {
            if (this.layers[i].name === name)
                return this.layers[i];
        }
    }
    // TODO: Rename to selectLayer
    setLayer(name) {
        let found = false;
        for (let layer of this.layers) {
            if (!layer.selectable)
                continue;
            if (found && layer.name !== 'fow')
                layer.ctx.globalAlpha = 0.3;
            else
                layer.ctx.globalAlpha = 1.0;
            if (name === layer.name) {
                store.commit("selectLayer", name);
                found = true;
            }
            layer.selection = [];
            layer.invalidate(true);
        }
        ;
    }
    getGridLayer() {
        return this.getLayer("grid");
    }
    hasSelection() {
        const selection = this.getSelection();
        return selection !== undefined && selection.length > 0;
    }
    // THIS INCLUDES POTENTIALLY THE SelectTool.SelectionHelper !!!
    getSelection() {
        const layer = this.getLayer();
        if (layer === undefined)
            return undefined;
        return layer.selection;
    }
    invalidate() {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            this.layers[i].invalidate(true);
        }
    }
    invalidateLight() {
        for (let i = this.layers.length - 1; i >= 0; i--)
            if (this.layers[i].isVisionLayer)
                this.layers[i].invalidate(true);
    }
    createLayer(layer) {
        const layersdiv = $("#layers");
        // UI changes
        if (!(layer.name === 'fow-players' && store.state.IS_DM))
            layersdiv.append("<canvas id='" + layer.name + "-layer' style='z-index: " + this.layers.length + "'></canvas>");
        if (layer.selectable) {
            const layerselectdiv = $("#layerselect");
            let extra = '';
            if (!this.layers.some(l => l.selectable))
                extra = " class='layer-selected'";
            layerselectdiv.find('ul').append("<li id='select-" + layer.name + "'" + extra + "><a href='#'>" + capitalize(layer.name) + "</a></li>");
        }
        let canvas;
        if (layer.name === 'fow-players') {
            canvas = document.createElement("canvas");
        }
        else {
            canvas = $('#' + layer.name + '-layer')[0];
        }
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // State changes
        let l;
        if (layer.grid)
            l = new GridLayer(canvas, layer.name);
        else if (layer.name === 'fow')
            l = new FOWLayer(canvas, layer.name);
        else if (layer.name === 'fow-players')
            l = new FOWPlayersLayer(canvas, layer.name);
        else
            l = new Layer(canvas, layer.name);
        l.selectable = layer.selectable;
        l.player_editable = layer.player_editable;
        gameManager.layerManager.addLayer(l);
        if (layer.grid) {
            store.commit("setGridSize", { size: layer.size, sync: false });
            $("#grid-layer").droppable({
                accept: ".draggable",
                drop: function (event, ui) {
                    if (gameManager.layerManager.getLayer() === undefined) {
                        console.log("No active layer to drop the token on");
                        return;
                    }
                    const l = gameManager.layerManager.getLayer();
                    const jCanvas = $(l.canvas);
                    if (jCanvas.length === 0) {
                        console.log("Canvas missing");
                        return;
                    }
                    const offset = jCanvas.offset();
                    const loc = new LocalPoint(ui.offset.left - offset.left, ui.offset.top - offset.top);
                    const settings_menu = $("#menu");
                    const locations_menu = $("#locations-menu");
                    if (settings_menu.is(":visible") && loc.x < settings_menu.width())
                        return;
                    if (locations_menu.is(":visible") && loc.y < locations_menu.width())
                        return;
                    // width = ui.helper[0].width;
                    // height = ui.helper[0].height;
                    const wloc = l2g(loc);
                    const img = (ui.helper[0]); //new Image();
                    // const src = (<HTMLElement>(ui.draggable[0].children[0])).dataset.img;
                    // if (src === undefined) return;
                    // img.src = src;
                    const asset = new Asset(img, wloc, img.width, img.height);
                    asset.src = new URL(img.src).pathname;
                    if (store.state.useGrid) {
                        const gs = store.state.gridSize;
                        asset.refPoint.x = Math.round(asset.refPoint.x / gs) * gs;
                        asset.refPoint.y = Math.round(asset.refPoint.y / gs) * gs;
                        asset.w = Math.max(Math.round(asset.w / gs), gs);
                        asset.h = Math.max(Math.round(asset.h / gs), gs);
                    }
                    l.addShape(asset, true);
                }
            });
        }
        else {
            l.setShapes(layer.shapes);
        }
    }
}
//# sourceMappingURL=manager.js.map