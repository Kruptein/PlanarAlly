import { markRaw, type DeepReadonly } from "vue";

import { registerSystem } from "../../../core/systems";
import type { System } from "../../../core/systems";
import {
    sendActiveLayer,
    sendFloorReorder,
    sendFloorSetBackground,
    sendFloorSetType,
    sendFloorSetVisible,
    sendRemoveFloor,
    sendRenameFloor,
} from "../../api/emits/floor";
import type { ILayer } from "../../interfaces/layer";
import type { IGridLayer } from "../../interfaces/layers/grid";
import { recalculateZIndices } from "../../layers/floor";
import { LayerName } from "../../models/floor";
import type { Floor, FloorId, FloorIndex, FloorType } from "../../models/floor";
import { TriangulationTarget, visionState } from "../../vision/state";
import { clientSystem } from "../client";
import { gameState } from "../game/state";
import { selectedSystem } from "../selected";
import { playerSettingsState } from "../settings/players/state";

import { floorState } from "./state";

type FloorRepresentation = { name: string } | { id: number } | { position: number };

const { mutableReactive: $, raw, currentFloor, currentLayer } = floorState;

class FloorSystem implements System {
    private indices: number[] = [];
    private lastFloorId = 0;
    private layerMap = new Map<number, ILayer[]>();

    clear(): void {
        $.floors = [];
        $.floorIndex = -1 as FloorIndex;
        $.layerIndex = -1;
        this.indices = [];
        this.lastFloorId = 0;
        this.layerMap.clear();
    }

    // FLOOR

    private _parseFloor(mode: "index", data: FloorRepresentation): FloorIndex | undefined;
    private _parseFloor(mode: "object", data: FloorRepresentation, readonly?: true): DeepReadonly<Floor> | undefined;
    private _parseFloor(mode: "object", data: FloorRepresentation, readonly: false): Floor | undefined;
    private _parseFloor(
        mode: "index" | "object",
        data: FloorRepresentation,
        readonly = true,
    ): number | DeepReadonly<Floor> | undefined {
        const method = mode === "index" ? "findIndex" : "find";
        const target = !readonly ? $ : floorState.reactive;
        if ("name" in data) return target.floors[method]((f) => f.name === data.name);
        if ("id" in data) return target.floors[method]((f) => f.id === data.id);
        return mode === "index" ? data.position : target.floors[data.position];
    }

    getFloor(data: FloorRepresentation, readonly: false): Floor | undefined;
    getFloor(data: FloorRepresentation, readonly?: true): DeepReadonly<Floor> | undefined;
    getFloor(data: FloorRepresentation, readonly = true): Floor | DeepReadonly<Floor> | undefined {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return this._parseFloor("object", data, readonly as any); // any cast needed because overload signature is not visible
    }

    getFloorIndex(data: FloorRepresentation): FloorIndex | undefined {
        return this._parseFloor("index", data);
    }

    generateFloorId(): FloorId {
        return this.lastFloorId++ as FloorId;
    }

    addFloor(floor: Floor, targetIndex?: number): void {
        // We do some special magic here to allow out of order loading of floors on startup
        if (targetIndex !== undefined) {
            const I = this.indices.findIndex((i) => i > targetIndex);
            if (I >= 0) {
                this.indices.splice(I, 0, targetIndex);
                $.floors.splice(I, 0, floor);
                if (I <= floorState.raw.floorIndex) $.floorIndex = (floorState.raw.floorIndex + 1) as FloorIndex;
            } else {
                this.indices.push(targetIndex);
                $.floors.push(floor);
            }
        } else {
            $.floors.push(floor);
        }
        this.layerMap.set(floor.id, []);
    }

    updateLayerVisibility(): void {
        for (const [fI, f] of floorState.raw.floors.entries()) {
            const hideFloor = playerSettingsState.raw.renderAllFloors.value
                ? fI > floorState.raw.floorIndex
                : fI !== floorState.raw.floorIndex;
            for (const layer of this.getLayers(f)) {
                if (hideFloor) layer.canvas.style.display = "none";
                else layer.canvas.style.removeProperty("display");
            }
        }
    }

    selectFloor(targetFloor: FloorRepresentation, sync: boolean): void {
        const targetFloorIndex = this.getFloorIndex(targetFloor);
        if (targetFloorIndex === floorState.raw.floorIndex || targetFloorIndex === undefined) return;
        const floor = this.getFloor(targetFloor)!;

        $.floorIndex = targetFloorIndex;
        $.layers = this.getLayers(floor).map((l) => markRaw(l));

        this.updateLayerVisibility();

        this.selectLayer(currentLayer.value!.name, sync, false);
        this.invalidateAllFloors();
    }

    renameFloor(index: number, name: string, sync: boolean): void {
        if (raw.floors[index] === undefined) return;

        $.floors[index]!.name = name;
        if (index === floorState.raw.floorIndex) this.invalidateAllFloors();
        if (sync) sendRenameFloor({ index, name });
    }

    removeFloor(floorRepresentation: FloorRepresentation, sync: boolean): void {
        const floorIndex = this.getFloorIndex(floorRepresentation);
        if (floorIndex === undefined) throw new Error("Could not remove unknown floor");
        const floor = floorState.raw.floors[floorIndex];
        if (floor === undefined) {
            console.error("Attempt to remove unknown floor.");
            return;
        }

        visionState.removeCdt(floor.id);
        visionState.removeBlockers(TriangulationTarget.MOVEMENT, floor.id);
        visionState.removeBlockers(TriangulationTarget.VISION, floor.id);

        for (const layer of this.getLayers(floor)) layer.canvas.remove();

        $.floors.splice(floorIndex, 1);
        this.layerMap.delete(floor.id);

        if (floorState.raw.floorIndex === floorIndex) this.selectFloor({ position: floorIndex - 1 }, true);
        else if (floorState.raw.floorIndex > floorIndex) $.floorIndex--;
        if (sync) sendRemoveFloor(floor.name);
    }

    setFloorPlayerVisible(floorRepresentation: FloorRepresentation, visible: boolean, sync: boolean): void {
        const floor = this.getFloor(floorRepresentation, false);
        if (floor === undefined) throw new Error("Could not update floor visibility for unknown floor");

        floor.playerVisible = visible;
        if (sync) sendFloorSetVisible({ name: floor.name, visible: floor.playerVisible });
    }

    reorderFloors(floors: string[], sync: boolean): void {
        const activeFloorName = floorState.raw.floors[floorState.raw.floorIndex]?.name;
        if (activeFloorName === undefined) {
            console.error("Current floor info could not be retrieved.");
            return;
        }

        $.floors = floors.map((name) => floorState.raw.floors.find((f) => f.name === name)!);
        $.floorIndex = this.getFloorIndex({ name: activeFloorName })!;
        recalculateZIndices();
        if (sync) sendFloorReorder(floors);
    }

    setFloorType(floorRepr: FloorRepresentation, floorType: FloorType, sync: boolean): void {
        if (!gameState.raw.isDm) return;
        const floor = this.getFloor(floorRepr, false);
        if (floor === undefined) return;

        floor.type = floorType;
        if (sync) sendFloorSetType({ name: floor.name, floorType });
    }

    setFloorBackground(floorRepr: FloorRepresentation, backgroundValue: string | undefined, sync: boolean): void {
        if (!gameState.raw.isDm) return;
        const floor = this.getFloor(floorRepr, false);
        if (floor === undefined) return;

        floor.backgroundValue = backgroundValue;
        this.invalidate(floor);
        if (sync) sendFloorSetBackground({ name: floor.name, background: backgroundValue });
    }

    // LAYERS

    addLayer(layer: ILayer, floorId: number): void {
        for (const floor of floorState.raw.floors) {
            if (floor.id === floorId) {
                this.layerMap.get(floor.id)!.push(layer);
                if (floorState.raw.layerIndex < 0) {
                    $.layerIndex = 2;
                }
                return;
            }
        }
        console.error(`Attempt to add layer to unknown floor ${floorId}`);
    }

    getLayer(floor: Floor, name?: LayerName): ILayer | undefined {
        const layers = this.layerMap.get(floor.id)!;
        if (name === undefined) return layers[floorState.raw.layerIndex];
        for (const layer of layers) {
            if (layer.name === name) return layer;
        }
    }

    getLayers(floor: Floor): ILayer[] {
        return this.layerMap.get(floor.id)!;
    }

    hasLayer(floor: Floor, name: LayerName): boolean {
        return this.layerMap.get(floor.id)?.some((f) => f.name === name) ?? false;
    }

    selectLayer(name: LayerName, sync = true, invalidate = true): void {
        selectedSystem.clear();
        for (const [index, layer] of this.getLayers(currentFloor.value!).entries()) {
            if (!layer.selectable) continue;

            if (name === layer.name) {
                $.layerIndex = index;
                if (sync) sendActiveLayer({ layer: layer.name, floor: this.getFloor({ id: layer.floor })!.name });
            }

            if (invalidate) layer.invalidate(true);
        }
    }

    getGridLayer(floor: Floor): IGridLayer | undefined {
        return this.getLayer(floor, LayerName.Grid) as IGridLayer;
    }

    // INVALIDATE

    invalidate(floorRepr: FloorRepresentation): void {
        const floor = this.getFloor(floorRepr, false)!;
        const layers = this.layerMap.get(floor.id)!;
        for (let i = layers.length - 1; i >= 0; i--) {
            layers[i]!.invalidate(true);
        }
    }

    invalidateAllFloors(): void {
        for (const [i, floor] of floorState.raw.floors.entries()) {
            if (!playerSettingsState.raw.renderAllFloors.value && floorState.raw.floorIndex !== i) continue;
            this.invalidate(floor);
        }
    }

    invalidateVisibleFloors(): void {
        let floorFound = false;
        for (const [i, floor] of floorState.raw.floors.entries()) {
            if (!playerSettingsState.raw.renderAllFloors.value && floorState.raw.floorIndex !== i) continue;
            if (floorFound) this.invalidateLight(floor.id);
            else this.invalidate(floor);
            if (floor === currentFloor.value) floorFound = true;
        }
    }

    // Lighting of multiple floors is heavily dependent on eachother
    // This method only updates a single floor and should thus only be used for very specific cases
    // as you typically require the allFloor variant
    invalidateLight(floorId: number): void {
        const layers = this.layerMap.get(floorId)!;
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i]!;
            if (layer.isVisionLayer) {
                layer.invalidate(true);
            } else if (layer.name === LayerName.Map && playerSettingsState.raw.renderAllFloors.value) {
                layer.invalidate(true);
            }
        }
    }

    invalidateLightAllFloors(): void {
        for (const [f, floor] of floorState.raw.floors.entries()) {
            if (f > floorState.raw.floorIndex) return;
            this.invalidateLight(floor.id);
        }
    }

    invalidateSectors(): void {
        for (const floor of floorState.raw.floors.values()) {
            for (const layer of this.layerMap.get(floor.id)?.values() ?? []) {
                layer.updateView();
            }
        }
    }

    updateIteration(): void {
        floorState.mutable.iteration++;
    }

    // WINDOW

    resize(width: number, height: number): void {
        for (const layer of [...this.layerMap.values()].flat()) {
            layer.resize(width, height);
        }
        clientSystem.sendViewportInfo();
        this.invalidateAllFloors();
    }
}

export const floorSystem = new FloorSystem();
registerSystem("floors", floorSystem, false, floorState);
