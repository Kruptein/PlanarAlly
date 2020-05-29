import { GridLayer } from "@/game/layers/grid";
import { Layer } from "@/game/layers/layer";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";

export interface Floor {
    name: string;
    layers: Layer[];
}

class LayerManager {
    floors: Floor[] = [];

    UUIDMap: Map<string, Shape> = new Map();

    // Refresh interval and redraw setter.
    interval = 30;

    constructor() {
        requestAnimationFrame(this.drawLoop);
    }

    reset(): void {
        this.floors = [];
        this.UUIDMap = new Map();
    }

    private drawFloor(floor: Floor): void {
        let fowLayer: Layer | undefined;
        for (const layer of floor.layers) {
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
        for (const [f, floor] of this.floors.entries()) {
            if (f === gameStore.selectedFloorIndex) continue;
            this.drawFloor(floor);
        }
        // Then process the current floor
        if (this.floor !== undefined) {
            this.drawFloor(this.floor);
        }
        for (let i = gameStore.selectedFloorIndex; i >= 0; i--) {
            for (const layer of this.floors[i].layers) {
                if (i === gameStore.selectedFloorIndex || !layer.isVisionLayer) layer.show();
            }
        }
        requestAnimationFrame(this.drawLoop);
    };

    get floor(): Floor | undefined {
        return this.floors[gameStore.selectedFloorIndex];
    }

    setWidth(width: number): void {
        for (const layer of this.floors.flatMap(f => f.layers)) {
            layer.width = width;
        }
    }

    setHeight(height: number): void {
        for (const layer of this.floors.flatMap(f => f.layers)) {
            layer.height = height;
        }
    }

    addLayer(layer: Layer, floorName: string): void {
        for (const floor of this.floors) {
            if (floor.name === floorName) {
                floor.layers.push(layer);
                if (!gameStore.IS_DM && !layer.playerEditable) return;
                if (layer.selectable && floorName === this.floor?.name) gameStore.addLayer(layer.name);
                return;
            }
        }
        console.error(`Attempt to add layer to unknown floor ${floorName}`);
    }

    hasLayer(floor: string, name: string): boolean {
        return this.getFloor(floor)!.layers.some(l => l.name === name);
    }

    getLayer(floor: string, name?: string): Layer | undefined {
        name = name === undefined ? gameStore.selectedLayer : name;
        for (const layer of this.getFloor(floor)?.layers || []) {
            if (layer.name === name) return layer;
        }
    }

    getFloor(name?: string): Floor | undefined {
        if (name === undefined) return this.floor;
        for (const floor of this.floors) if (floor.name === name) return floor;
    }

    selectLayer(name: string, sync = true, invalidate = true): void {
        let found = false;
        for (const layer of this.floor!.layers) {
            if (!layer.selectable) continue;
            if (found && layer.name !== "fow") layer.ctx.globalAlpha = 0.3;
            else layer.ctx.globalAlpha = 1.0;

            if (name === layer.name) {
                gameStore.selectLayer({ layer, sync });
                found = true;
            }

            layer.clearSelection();
            if (invalidate) layer.invalidate(true);
        }
    }

    getGridLayer(floor: string): GridLayer | undefined {
        return <GridLayer>this.getLayer(floor, "grid");
    }

    hasSelection(): boolean {
        const selection = this.getSelection();
        return selection !== undefined && selection.length > 0;
    }

    // THIS INCLUDES POTENTIALLY THE SelectTool.SelectionHelper !!!
    getSelection(): Shape[] | undefined {
        const layer = this.getLayer(this.floor!.name);
        if (layer === undefined) return undefined;
        return layer.selection;
    }

    clearSelection(): void {
        const layer = this.getLayer(layerManager.floor!.name);
        if (layer) {
            layer.clearSelection();
            layer.invalidate(true);
        }
    }

    invalidate(floorName: string): void {
        const floor = this.getFloor(floorName)!;
        for (let i = floor.layers.length - 1; i >= 0; i--) {
            floor.layers[i].invalidate(true);
        }
    }

    invalidateAllFloors(): void {
        for (const floor of this.floors) {
            this.invalidate(floor.name);
        }
    }

    // Lighting of multiple floors is heavily dependent on eachother
    // This method only updates a single floor and should thus only be used for very specific cases
    // as you typically require the allFloor variant
    invalidateLight(floorName: string): void {
        const floor = this.getFloor(floorName);
        if (floor === undefined) {
            console.error(`Unknown floor ${floorName} requested light invalidation`);
            return;
        }
        for (let i = floor.layers.length - 1; i >= 0; i--)
            if (floor.layers[i].isVisionLayer) floor.layers[i].invalidate(true);
    }

    invalidateLightAllFloors(): void {
        for (const [f, floor] of this.floors.entries()) {
            if (f > gameStore.selectedFloorIndex) return;
            this.invalidateLight(floor.name);
        }
    }
}

export const layerManager = new LayerManager();
(<any>window).lm = layerManager;
