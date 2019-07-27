import { GridLayer } from "@/game/layers/grid";
import { Layer } from "@/game/layers/layer";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";

class LayerManager {
    layers: Layer[] = [];
    width = window.innerWidth;
    height = window.innerHeight;

    UUIDMap: Map<string, Shape> = new Map();

    // Refresh interval and redraw setter.
    interval = 30;

    constructor() {
        requestAnimationFrame(this.drawLoop);
    }

    reset() {
        this.layers = [];
        this.UUIDMap = new Map();
    }

    drawLoop = () => {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            this.layers[i].draw();
        }
        requestAnimationFrame(this.drawLoop);
    };

    setWidth(width: number): void {
        this.width = width;
        for (const layer of this.layers) {
            layer.canvas.width = width;
            layer.width = width;
        }
    }

    setHeight(height: number): void {
        this.height = height;
        for (const layer of this.layers) {
            layer.canvas.height = height;
            layer.height = height;
        }
    }

    addLayer(layer: Layer): void {
        this.layers.push(layer);
        if (!gameStore.IS_DM && !layer.playerEditable) return;
        if (layer.selectable) gameStore.addLayer(layer.name);
    }

    hasLayer(name: string): boolean {
        return this.layers.some(l => l.name === name);
    }

    getLayer(name?: string) {
        name = name === undefined ? gameStore.selectedLayer : name;
        for (const layer of this.layers) {
            if (layer.name === name) return layer;
        }
    }

    selectLayer(name: string, sync: boolean = true): void {
        let found = false;
        for (const layer of this.layers) {
            if (!layer.selectable) continue;
            if (found && layer.name !== "fow") layer.ctx.globalAlpha = 0.3;
            else layer.ctx.globalAlpha = 1.0;

            if (name === layer.name) {
                gameStore.selectLayer({ name, sync });
                found = true;
            }

            layer.clearSelection();
            layer.invalidate(true);
        }
    }

    getGridLayer(): GridLayer | undefined {
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
            if (this.layers[i].isVisionLayer) this.layers[i].invalidate(true);
    }
}

export const layerManager = new LayerManager();
(<any>window).lm = layerManager;
