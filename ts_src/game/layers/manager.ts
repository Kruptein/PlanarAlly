import { Layer } from "./layer";
import Shape from "../shapes/shape";
import { GridLayer } from "./grid";
import { ServerLayer } from "../api_types";
import gameManager from "../planarally";
import { capitalize } from "../../core/utils";
import Settings from "../settings";
import { FOWLayer } from "./fow";
import { LocalPoint } from "../geom";
import { l2g } from "../units";
import Asset from "../shapes/asset";
import { FOWPlayersLayer } from "./fowplayers";
import store from "../store";

export class LayerManager {
    layers: Layer[] = [];
    width = window.innerWidth;
    height = window.innerHeight;

    UUIDMap: Map<string, Shape> = new Map();

    // Refresh interval and redraw setter.
    interval = 30;

    constructor() {
        const lm = this;
        setInterval(function () {
            for (let i = lm.layers.length - 1; i >= 0; i--) {
                lm.layers[i].draw();
            }
        }, this.interval);
    }

    setWidth(width: number): void {
        this.width = width;
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].canvas.width = width;
            this.layers[i].width = width;
        }
    }

    setHeight(height: number): void {
        this.height = height;
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].canvas.height = height;
            this.layers[i].height = height;
        }
    }

    addLayer(layer: Layer): void {
        this.layers.push(layer);
        if (layer.selectable)
            store.commit("addLayer", layer.name);
    }

    hasLayer(name: string): boolean {
        return this.layers.some(l => l.name === name);
    }

    getLayer(name?: string) {
        name = (name === undefined) ? store.getters.selectedLayer : name;
        for (let i = 0; i < this.layers.length; i++) {
            if (this.layers[i].name === name) return this.layers[i];
        }
    }

    // TODO: Rename to selectLayer
    setLayer(name: string): void {
        let found = false;
        for (let layer of this.layers) {
            if (!layer.selectable) continue;
            if (found && layer.name !== 'fow') layer.ctx.globalAlpha = 0.3;
            else layer.ctx.globalAlpha = 1.0;

            if (name === layer.name) {
                store.commit("selectLayer", name);
                found = true;
            }

            layer.selection = [];
            layer.invalidate(true);
        };
    }

    getGridLayer(): GridLayer|undefined {
        return <GridLayer>this.getLayer("grid");
    }

    hasSelection() {
        const selection = this.getSelection();
        return selection !== undefined && selection.length > 0;
    }

    // THIS INCLUDES POTENTIALLY THE SelectTool.SelectionHelper !!!
    getSelection() {
        const layer = this.getLayer();
        if (layer === undefined) return undefined;
        return layer.selection;
    }

    invalidate(): void {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            this.layers[i].invalidate(true);
        }
    }

    invalidateLight() {
        for (let i = this.layers.length - 1; i >= 0; i--)
            if (this.layers[i].isVisionLayer)
                this.layers[i].invalidate(true);
    }
}