import { GridLayer } from "@/game/layers/grid";
import { Layer } from "@/game/layers/layer";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";

class LayerManager {
    floors: { name: string; layers: Layer[] }[] = [];
    width = window.innerWidth;
    height = window.innerHeight;

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

    drawLoop = (): void => {
        for (const [f, floor] of this.floors.entries()) {
            if (f > gameStore.selectedFloorIndex) break;
            for (let i = floor.layers.length - 1; i >= 0; i--) {
                floor.layers[i].draw();
            }
        }
        requestAnimationFrame(this.drawLoop);
    };

    get floor(): { name: string; layers: Layer[] } | undefined {
        return this.floors[gameStore.selectedFloorIndex];
    }

    setWidth(width: number): void {
        this.width = width;
        for (const layer of this.floors.flatMap(f => f.layers)) {
            layer.canvas.width = width;
            layer.width = width;
        }
    }

    setHeight(height: number): void {
        this.height = height;
        for (const layer of this.floors.flatMap(f => f.layers)) {
            layer.canvas.height = height;
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

    getFloor(name?: string): { name: string; layers: Layer[] } | undefined {
        if (name === undefined) return this.floor;
        for (const floor of this.floors) if (floor.name === name) return floor;
    }

    selectLayer(name: string, sync = true): void {
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
            layer.invalidate(true);
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

    invalidate(floorName: string): void {
        const floor = this.getFloor(floorName)!;
        for (let i = floor.layers.length - 1; i >= 0; i--) {
            floor.layers[i].invalidate(true);
        }
    }

    invalidateAllFloors(): void {
        for (const [f, floor] of this.floors.entries()) {
            if (f > gameStore.selectedFloorIndex) return;
            this.invalidate(floor.name);
        }
    }

    invalidateLight(floorName: string): void {
        for (const floor of this.floors) {
            for (let i = floor.layers.length - 1; i >= 0; i--)
                if (floor.layers[i].isVisionLayer) floor.layers[i].invalidate(true);
            if (floorName && floor.name === floorName) return;
        }
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
