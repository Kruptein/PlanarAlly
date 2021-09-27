import { computed } from "@vue/runtime-core";
import type { ComputedRef, DeepReadonly } from "@vue/runtime-core";

import { Store } from "../core/store";
import {
    sendActiveLayer,
    sendFloorReorder,
    sendFloorSetBackground,
    sendFloorSetType,
    sendFloorSetVisible,
    sendRemoveFloor,
    sendRenameFloor,
} from "../game/api/emits/floor";
import { addNewGroup, hasGroup } from "../game/groups";
import { createCanvas } from "../game/layers/canvas";
import { recalculateZIndices } from "../game/layers/floor";
import { selectionState } from "../game/layers/selection";
import { FowLightingLayer } from "../game/layers/variants/fowLighting";
import { FowVisionLayer } from "../game/layers/variants/fowVision";
import { GridLayer } from "../game/layers/variants/grid";
import { Layer } from "../game/layers/variants/layer";
import { MapLayer } from "../game/layers/variants/map";
import { LayerName } from "../game/models/floor";
import type { Floor, FloorType } from "../game/models/floor";
import type { ServerFloor, ServerLayer } from "../game/models/general";
import { groupToClient } from "../game/models/groups";
import { TriangulationTarget, visionState } from "../game/vision/state";

import { gameStore } from "./game";

interface FloorState {
    floors: Floor[];
    floorIndex: number;

    layerIndex: number;
}

type FloorRepresentation = { name: string } | { id: number } | { position: number };

class FloorStore extends Store<FloorState> {
    private indices: number[] = [];
    private lastFloorId = 0;
    private layerMap: Map<number, Layer[]> = new Map();

    currentFloor: ComputedRef<Floor | undefined>;
    currentLayer: ComputedRef<Layer | undefined>;

    constructor() {
        super();
        this.currentFloor = computed(() => {
            if (this._state.floorIndex < 0) return undefined;
            return this._state.floors[this._state.floorIndex];
        });
        this.currentLayer = computed(() => {
            const floor = this.currentFloor.value;
            if (floor === undefined) return undefined;
            return this.getLayer(floor);
        });
    }

    protected data(): FloorState {
        return {
            floors: [],
            floorIndex: -1,

            layerIndex: -1,
        };
    }

    clear(): void {
        this._state.floors = [];
        this.indices = [];
        this._state.floorIndex = -1;
        this._state.layerIndex = -1;
        this.layerMap.clear();
    }

    // FLOOR

    private _parseFloor(mode: "index", data: FloorRepresentation): number | undefined;
    private _parseFloor(mode: "object", data: FloorRepresentation, readonly?: true): DeepReadonly<Floor> | undefined;
    private _parseFloor(mode: "object", data: FloorRepresentation, readonly: false): Floor | undefined;
    private _parseFloor(
        mode: "index" | "object",
        data: FloorRepresentation,
        readonly = true,
    ): number | DeepReadonly<Floor> | undefined {
        const method = mode === "index" ? "findIndex" : "find";
        const target = readonly === false ? floorStore._state : floorStore.state;
        if ("name" in data) return target.floors[method]((f) => f.name === data.name);
        if ("id" in data) return target.floors[method]((f) => f.id === data.id);
        return mode === "index" ? data.position : target.floors[data.position];
    }

    getFloor(data: FloorRepresentation, readonly: false): Floor | undefined;
    getFloor(data: FloorRepresentation, readonly?: true): DeepReadonly<Floor> | undefined;
    getFloor(data: FloorRepresentation, readonly = true): Floor | DeepReadonly<Floor> | undefined {
        return this._parseFloor("object", data, readonly as any); // any cast needed because overload signature is not visible
    }

    getFloorIndex(data: FloorRepresentation): number | undefined {
        return this._parseFloor("index", data);
    }

    generateFloorId(): number {
        return this.lastFloorId++;
    }

    addServerFloor(serverFloor: ServerFloor): void {
        const floor: Floor = {
            id: floorStore.generateFloorId(),
            name: serverFloor.name,
            playerVisible: serverFloor.player_visible,
            type: serverFloor.type_,
            backgroundValue: serverFloor.background_color ?? undefined,
        };
        this.addFloor(floor, serverFloor.index);
        visionState.addCdt(this.getFloor({ name: serverFloor.name })!.id);
        for (const layer of serverFloor.layers) this.addServerLayer(layer, floor);
        visionState.recalculateVision(this.getFloor({ name: floor.name })!.id);
        visionState.recalculateMovement(this.getFloor({ name: floor.name })!.id);

        recalculateZIndices();
    }

    private addFloor(floor: Floor, targetIndex?: number): void {
        // We do some special magic here to allow out of order loading of floors on startup
        if (targetIndex !== undefined) {
            const I = this.indices.findIndex((i) => i > targetIndex);
            if (I >= 0) {
                this.indices.splice(I, 0, targetIndex);
                this._state.floors.splice(I, 0, floor);
                if (I <= this._state.floorIndex) this._state.floorIndex += 1;
            } else {
                this.indices.push(targetIndex);
                this._state.floors.push(floor);
            }
        } else {
            this._state.floors.push(floor);
        }
        this.layerMap.set(floor.id, []);
    }

    selectFloor(targetFloor: FloorRepresentation, sync: boolean): void {
        const targetFloorIndex = this.getFloorIndex(targetFloor);
        if (targetFloorIndex === this._state.floorIndex || targetFloorIndex === undefined) return;

        this._state.floorIndex = targetFloorIndex;
        for (const [f, floor] of floorStore.state.floors.entries()) {
            for (const layer of this.getLayers(floor)) {
                if (f > targetFloorIndex) layer.canvas.style.display = "none";
                else layer.canvas.style.removeProperty("display");
            }
        }
        this.selectLayer(this.currentLayer.value!.name, sync, false);
        this.invalidateAllFloors();
    }

    renameFloor(index: number, name: string, sync: boolean): void {
        this._state.floors[index].name = name;
        if (index === this._state.floorIndex) this.invalidateAllFloors();
        if (sync) sendRenameFloor({ index, name });
    }

    removeFloor(floorRepresentation: FloorRepresentation, sync: boolean): void {
        const floorIndex = this.getFloorIndex(floorRepresentation);
        if (floorIndex === undefined) throw new Error("Could not remove unknown floor");
        const floor = this._state.floors[floorIndex];

        visionState.removeCdt(floor.id);
        visionState.removeBlockers(TriangulationTarget.MOVEMENT, floor.id);
        visionState.removeBlockers(TriangulationTarget.VISION, floor.id);

        for (const layer of this.getLayers(floor)) layer.canvas.remove();

        this._state.floors.splice(floorIndex, 1);
        this.layerMap.delete(floor.id);

        if (this._state.floorIndex === floorIndex) this.selectFloor({ position: floorIndex - 1 }, true);
        else if (this._state.floorIndex > floorIndex) this._state.floorIndex--;
        if (sync) sendRemoveFloor(floor.name);
    }

    setFloorPlayerVisible(floorRepresentation: FloorRepresentation, visible: boolean, sync: boolean): void {
        const floor = this.getFloor(floorRepresentation, false);
        if (floor === undefined) throw new Error("Could not update floor visibility for unknown floor");

        floor.playerVisible = visible;
        if (sync) sendFloorSetVisible({ name: floor.name, visible: floor.playerVisible });
    }

    reorderFloors(floors: string[], sync: boolean): void {
        const activeFloorName = this._state.floors[this._state.floorIndex].name;
        this._state.floors = floors.map((name) => this._state.floors.find((f) => f.name === name)!);
        this._state.floorIndex = this.getFloorIndex({ name: activeFloorName })!;
        recalculateZIndices();
        if (sync) sendFloorReorder(floors);
    }

    setFloorType(floorRepr: FloorRepresentation, floorType: FloorType, sync: boolean): void {
        if (!gameStore.state.isDm) return;
        const floor = this.getFloor(floorRepr, false);
        if (floor === undefined) return;

        floor.type = floorType;
        if (sync) sendFloorSetType({ name: floor.name, floorType });
    }

    setFloorBackground(floorRepr: FloorRepresentation, backgroundValue: string | undefined, sync: boolean): void {
        if (!gameStore.state.isDm) return;
        const floor = this.getFloor(floorRepr, false);
        if (floor === undefined) return;

        floor.backgroundValue = backgroundValue;
        this.invalidate(floor);
        if (sync) sendFloorSetBackground({ name: floor.name, background: backgroundValue });
    }

    // LAYERS

    addServerLayer(layerInfo: ServerLayer, floor: Floor): void {
        const canvas = createCanvas();

        const layerName = layerInfo.name as LayerName;

        // Create the Layer instance
        let layer: Layer;
        if (layerInfo.type_ === LayerName.Grid) {
            layer = new GridLayer(canvas, layerName, floor.id, layerInfo.index);
        } else if (layerInfo.type_ === LayerName.Lighting) {
            layer = new FowLightingLayer(canvas, layerName, floor.id, layerInfo.index);
        } else if (layerInfo.type_ === LayerName.Vision) {
            layer = new FowVisionLayer(canvas, layerName, floor.id, layerInfo.index);
        } else if (layerName === LayerName.Map) {
            layer = new MapLayer(canvas, layerName, floor.id, layerInfo.index);
        } else {
            layer = new Layer(canvas, layerName, floor.id, layerInfo.index);
        }
        layer.selectable = layerInfo.selectable;
        layer.playerEditable = layerInfo.player_editable;
        this.addLayer(layer, floor.id);

        // Add the element to the DOM
        const layers = document.getElementById("layers");
        if (layers === null) {
            console.warn("Layers div is missing, this will prevent the main game board from loading!");
            return;
        }
        if (layerInfo.name !== "fow-players") layers.appendChild(canvas);

        // Load layer groups

        for (const serverGroup of layerInfo.groups) {
            const group = groupToClient(serverGroup);
            if (!hasGroup(group.uuid)) {
                addNewGroup(group, false);
            }
        }

        // Load layer shapes
        layer.setServerShapes(layerInfo.shapes);
    }

    addLayer(layer: Layer, floorId: number): void {
        for (const floor of this._state.floors) {
            if (floor.id === floorId) {
                this.layerMap.get(floor.id)!.push(layer);
                if (this._state.layerIndex < 0) {
                    this._state.layerIndex = 2;
                }
                return;
            }
        }
        console.error(`Attempt to add layer to unknown floor ${floorId}`);
    }

    getLayer(floor: Floor, name?: LayerName): Layer | undefined {
        const layers = this.layerMap.get(floor.id)!;
        if (name === undefined) return layers[this._state.layerIndex];
        for (const layer of layers) {
            if (layer.name === name) return layer;
        }
    }

    getLayers(floor: Floor): Layer[] {
        return this.layerMap.get(floor.id)!;
    }

    hasLayer(floor: Floor, name: LayerName): boolean {
        return this.layerMap.get(floor.id)?.some((f) => f.name === name) ?? false;
    }

    selectLayer(name: string, sync = true, invalidate = true): void {
        let found = false;
        selectionState.clear(false);
        for (const [index, layer] of this.getLayers(this.currentFloor.value!).entries()) {
            if (!layer.selectable) continue;
            if (found && layer.name !== LayerName.Lighting) layer.ctx.globalAlpha = 0.3;
            else layer.ctx.globalAlpha = 1.0;

            if (name === layer.name) {
                this._state.layerIndex = index;
                found = true;
                if (sync) sendActiveLayer({ layer: layer.name, floor: this.getFloor({ id: layer.floor })!.name });
            }

            if (invalidate) layer.invalidate(true);
        }
    }

    getGridLayer(floor: Floor): GridLayer | undefined {
        return this.getLayer(floor, LayerName.Grid) as GridLayer;
    }

    // INVALIDATE

    invalidate(floorRepr: FloorRepresentation): void {
        const floor = this.getFloor(floorRepr, false)!;
        const layers = this.layerMap.get(floor.id)!;
        for (let i = layers.length - 1; i >= 0; i--) {
            layers[i].invalidate(true);
        }
    }

    invalidateAllFloors(): void {
        for (const floor of this._state.floors) {
            this.invalidate(floor);
        }
    }

    invalidateVisibleFloors(): void {
        let floorFound = false;
        for (const floor of this._state.floors) {
            if (floorFound) this.invalidateLight(floor.id);
            else this.invalidate(floor);
            if (floor === this.currentFloor.value) floorFound = true;
        }
    }

    // Lighting of multiple floors is heavily dependent on eachother
    // This method only updates a single floor and should thus only be used for very specific cases
    // as you typically require the allFloor variant
    invalidateLight(floorId: number): void {
        const layers = this.layerMap.get(floorId)!;
        for (let i = layers.length - 1; i >= 0; i--)
            if (layers[i].isVisionLayer || layers[i].name === "map") layers[i].invalidate(true);
    }

    invalidateLightAllFloors(): void {
        for (const [f, floor] of this._state.floors.entries()) {
            if (f > this._state.floorIndex) return;
            this.invalidateLight(floor.id);
        }
    }

    // WINDOW

    resize(width: number, height: number): void {
        for (const layer of [...this.layerMap.values()].flat()) {
            layer.resize(width, height);
        }
        floorStore.invalidateAllFloors();
    }
}

export const floorStore = new FloorStore();
(window as any).floorStore = floorStore;
