import { GridLayer } from "@/game/layers/grid";
import { Layer } from "@/game/layers/layer";
import { Shape } from "@/game/shapes/shape";
import { sendActiveLayer } from "../api/emits/floor";
import { Floor } from "./floor";
import { floorStore } from "./store";

class LayerManager {
    UUIDMap: Map<string, Shape> = new Map();
    private layerMap: Map<number, Layer[]> = new Map();

    // Refresh interval and redraw setter.
    interval = 30;

    reset(): void {
        this.layerMap = new Map();
        this.UUIDMap = new Map();
    }

    addFloor(id: number): void {
        this.layerMap.set(id, []);
    }

    removeFloor(id: number): void {
        this.layerMap.delete(id);
    }

    private drawFloor(floor: Floor): void {
        let fowLayer: Layer | undefined;
        for (const layer of this.getLayers(floor)) {
            layer.hide();
            // we need to draw fow later because it depends on fow-players
            // and historically we did the draw loop in the other direction
            if (layer.name === "fow") {
                fowLayer = layer;
                continue;
            }
            layer.draw();
        }
        if (fowLayer) fowLayer.draw();
    }

    drawLoop = (): void => {
        // First process all other floors
        for (const [f, floor] of floorStore.floors.entries()) {
            if (f === floorStore.currentFloorindex) continue;
            this.drawFloor(floor);
        }
        // Then process the current floor
        if (floorStore.currentFloor !== undefined) {
            this.drawFloor(floorStore.currentFloor);
        }
        for (let i = floorStore.currentFloorindex; i >= 0; i--) {
            const floor = floorStore.floors[i];
            for (const layer of this.getLayers(floor)) {
                if (i === floorStore.currentFloorindex || !layer.isVisionLayer) layer.show();
            }
        }
        requestAnimationFrame(this.drawLoop);
    };

    setWidth(width: number): void {
        for (const layer of [...this.layerMap.values()].flat()) {
            layer.width = width;
        }
    }

    setHeight(height: number): void {
        for (const layer of [...this.layerMap.values()].flat()) {
            layer.height = height;
        }
    }

    addLayer(layer: Layer, floorId: number): void {
        for (const floor of floorStore.floors) {
            if (floor.id === floorId) {
                this.getLayers(floor).push(layer);
                if (floorStore.currentLayerIndex < 0) {
                    floorStore.setLayerIndex(2);
                }
                return;
            }
        }
        console.error(`Attempt to add layer to unknown floor ${floorId}`);
    }

    get layerLength(): number {
        return this.layerMap.values.length;
    }

    getLayers(floor: Floor): Layer[] {
        return this.layerMap.get(floor.id)!;
    }

    hasLayer(floor: Floor, name: string): boolean {
        return this.getLayers(floor).some(l => l.name === name);
    }

    getLayer(floor: Floor, name?: string): Layer | undefined {
        const layers = this.getLayers(floor);
        if (name === undefined) return layers[floorStore.currentLayerIndex];
        for (const layer of layers) {
            if (layer.name === name) return layer;
        }
    }

    getFloor(id?: number): Floor | undefined {
        if (name === undefined) return floorStore.currentFloor;
        return floorStore.floors.find(f => f.id === id);
    }

    selectLayer(name: string, sync = true, invalidate = true): void {
        let found = false;
        for (const [index, layer] of this.getLayers(floorStore.currentFloor).entries()) {
            if (!layer.selectable) continue;
            if (found && layer.name !== "fow") layer.ctx.globalAlpha = 0.3;
            else layer.ctx.globalAlpha = 1.0;

            if (name === layer.name) {
                floorStore.setLayerIndex(index);
                found = true;
                if (sync) sendActiveLayer({ layer: layer.name, floor: this.getFloor(layer.floor)!.name });
            }

            layer.clearSelection();
            if (invalidate) layer.invalidate(true);
        }
    }

    getGridLayer(floor: Floor): GridLayer | undefined {
        return this.getLayer(floor, "grid") as GridLayer;
    }

    hasSelection(): boolean {
        const selection = this.getSelection();
        return selection !== undefined && selection.length > 0;
    }

    getSelection(skipUiHelpers = true): readonly Shape[] | undefined {
        const layer = this.getLayer(floorStore.currentFloor);
        if (layer === undefined) return undefined;
        return layer.getSelection(skipUiHelpers);
    }

    clearSelection(): void {
        const layer = this.getLayer(floorStore.currentFloor);
        if (layer) {
            layer.clearSelection();
            layer.invalidate(true);
        }
    }

    invalidate(floor: Floor): void {
        const layers = this.getLayers(floor);
        for (let i = layers.length - 1; i >= 0; i--) {
            layers[i].invalidate(true);
        }
    }

    invalidateAllFloors(): void {
        for (const floor of floorStore.floors) {
            this.invalidate(floor);
        }
    }

    invalidateVisibleFloors(): void {
        const current = floorStore.currentFloor;
        for (const floor of floorStore.floors) {
            this.invalidate(floor);
            if (floor === current) break;
        }
    }

    // Lighting of multiple floors is heavily dependent on eachother
    // This method only updates a single floor and should thus only be used for very specific cases
    // as you typically require the allFloor variant
    invalidateLight(floor: Floor): void {
        const layers = this.getLayers(floor);
        for (let i = layers.length - 1; i >= 0; i--) if (layers[i].isVisionLayer) layers[i].invalidate(true);
    }

    invalidateLightAllFloors(): void {
        for (const [f, floor] of floorStore.floors.entries()) {
            if (f > floorStore.currentFloorindex) return;
            this.invalidateLight(floor);
        }
    }
}

export const layerManager = new LayerManager();
(window as any).lm = layerManager;
