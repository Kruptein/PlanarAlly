import type { DeepReadonly } from "vue";

import { registerSystem } from "..";
import type { System } from "..";
import { postUi } from "../../../messages/ui";
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
import { moveFloor } from "../../temp";
import { TriangulationTarget, visionState } from "../../vision/state";
import { clientSystem } from "../client";
import { gameState } from "../game/state";
import { selectedSystem } from "../selected";
import { playerSettingsState } from "../settings/players/state";

import { floorState } from "./state";

type FloorRepresentation = { name: string } | { id: number } | { index: number };

const { mutable, readonly } = floorState;

class FloorSystem implements System {
    private indices: number[] = [];
    private lastFloorId = 0;
    private layerMap = new Map<number, ILayer[]>();

    clear(): void {
        mutable.floors = [];
        this.setFloorIndex(-1 as FloorIndex);
        this.setLayerIndex(-1);
        this.indices = [];
        this.lastFloorId = 0;
        this.layerMap.clear();
    }

    setFloorIndex(index: FloorIndex): void {
        mutable.floorIndex = index;
        const f = readonly.floors.at(readonly.floorIndex);
        mutable.currentFloor = f;
        mutable.layers = f === undefined ? [] : this.getLayers(f);
        this.updateCurrentLayer();
        void postUi("Floor.Index.Set", {
            index,
            layerIndex: mutable.layerIndex,
            layers: this.getClientLayers(),
        });
    }

    private setLayerIndex(index: number): void {
        mutable.layerIndex = index;
        this.updateCurrentLayer();
        void postUi("Layer.Index.Set", index);
    }

    private updateCurrentLayer(): void {
        mutable.currentLayer = mutable.layers[readonly.layerIndex];
    }

    private getClientLayers(): { name: LayerName; available: boolean }[] {
        return mutable.layers.map((l) => ({
            name: l.name,
            available: l.selectable && (l.playerEditable || gameState.raw.isDm),
        }));
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
        const target = !readonly ? mutable : floorState.readonly;
        if ("name" in data) return target.floors[method]((f) => f.name === data.name);
        if ("id" in data) return target.floors[method]((f) => f.id === data.id);
        return mode === "index" ? data.index : target.floors[data.index];
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
                mutable.floors.splice(I, 0, floor);
                if (I <= readonly.floorIndex) this.setFloorIndex((floorState.readonly.floorIndex + 1) as FloorIndex);
            } else {
                this.indices.push(targetIndex);
                mutable.floors.push(floor);
            }
        } else {
            mutable.floors.push(floor);
        }
        this.layerMap.set(floor.id, []);
        void postUi("Floors.Set", mutable.floors);
    }

    updateLayerVisibility(indices?: Map<string, string>): void {
        const data: { name: string; visible: boolean; index?: string }[] = [];
        for (const [fI, f] of floorState.readonly.floors.entries()) {
            const hideFloor = playerSettingsState.raw.renderAllFloors.value
                ? fI > floorState.readonly.floorIndex
                : fI !== floorState.readonly.floorIndex;
            for (const layer of this.getLayers(f)) {
                if (layer.name === LayerName.Vision) continue;
                const layerIdentifier = `${f.id}-${layer.name}`;
                data.push({ name: layerIdentifier, visible: !hideFloor, index: indices?.get(layerIdentifier) });
            }
        }
        void postUi("Canvas.Visibility", data);
    }

    selectFloor(targetFloor: FloorRepresentation, sync: boolean): void {
        const targetFloorIndex = this.getFloorIndex(targetFloor);
        if (targetFloorIndex === floorState.readonly.floorIndex || targetFloorIndex === undefined) return;

        this.setFloorIndex(targetFloorIndex);

        this.updateLayerVisibility();

        this.selectLayer(readonly.currentLayer!.name, sync, false);
        this.invalidateAllFloors();
    }

    renameFloor(index: FloorIndex, name: string, sync: boolean): void {
        if (readonly.floors[index] === undefined) return;

        mutable.floors[index]!.name = name;
        if (index === floorState.readonly.floorIndex) this.invalidateAllFloors();
        if (sync) sendRenameFloor({ index, name });
    }

    removeFloor(floorRepresentation: FloorRepresentation, sync: boolean): void {
        const floorIndex = this.getFloorIndex(floorRepresentation);
        if (floorIndex === undefined) throw new Error("Could not remove unknown floor");
        const floor = floorState.readonly.floors[floorIndex];
        if (floor === undefined) {
            console.error("Attempt to remove unknown floor.");
            return;
        }

        visionState.removeCdt(floor.id);
        visionState.removeBlockers(TriangulationTarget.MOVEMENT, floor.id);
        visionState.removeBlockers(TriangulationTarget.VISION, floor.id);

        for (const layer of this.getLayers(floor)) layer.canvas.remove();

        mutable.floors.splice(floorIndex, 1);
        this.layerMap.delete(floor.id);

        if (floorState.readonly.floorIndex === floorIndex) this.selectFloor({ index: floorIndex - 1 }, true);
        else if (floorState.readonly.floorIndex > floorIndex)
            this.setFloorIndex((readonly.floorIndex - 1) as FloorIndex);
        if (sync) sendRemoveFloor(floor.name);
    }

    setFloorPlayerVisible(floorRepresentation: FloorRepresentation, visible: boolean, sync: boolean): void {
        const floor = this.getFloor(floorRepresentation, false);
        if (floor === undefined) throw new Error("Could not update floor visibility for unknown floor");

        floor.playerVisible = visible;
        if (sync) sendFloorSetVisible({ name: floor.name, visible: floor.playerVisible });
    }

    reorderFloors(floors: string[], sync: boolean): void {
        const activeFloorName = floorState.readonly.floors[floorState.readonly.floorIndex]?.name;
        if (activeFloorName === undefined) {
            console.error("Current floor info could not be retrieved.");
            return;
        }

        mutable.floors = floors.map((name) => floorState.readonly.floors.find((f) => f.name === name)!);
        this.setFloorIndex(this.getFloorIndex({ name: activeFloorName })!);
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

    // important: this is NOT a FloorId, but a FloorPosition
    changeFloor(targetFloor: number, altPressed: boolean, shiftPressed: boolean): void {
        const newFloor = floorState.readonly.floors[targetFloor];
        if (newFloor === undefined) return;

        const selection = selectedSystem.get({ includeComposites: false });

        if (altPressed) {
            moveFloor([...selectedSystem.get({ includeComposites: true })], newFloor, true);
        }
        selectedSystem.clear();
        floorState.readonly.currentLayer?.invalidate(true);
        if (!altPressed || shiftPressed) {
            floorSystem.selectFloor({ index: targetFloor }, true);
        }
        if (shiftPressed) {
            selectedSystem.push(...selection.map((s) => s.id));
        }
    }

    // LAYERS

    addLayer(layer: ILayer, floorId: number): void {
        for (const floor of floorState.readonly.floors) {
            if (floor.id === floorId) {
                this.layerMap.get(floor.id)!.push(layer);
                if (readonly.layerIndex < 0) {
                    this.setLayerIndex(2);
                }
                return;
            }
        }
        console.error(`Attempt to add layer to unknown floor ${floorId}`);
    }

    getLayer(floor: Floor, name?: LayerName): ILayer | undefined {
        const layers = this.layerMap.get(floor.id)!;
        if (name === undefined) return mutable.currentLayer;
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
        for (const [index, layer] of this.getLayers(readonly.currentFloor!).entries()) {
            if (!layer.selectable) continue;

            if (name === layer.name) {
                this.setLayerIndex(index);
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
        for (const [i, floor] of floorState.readonly.floors.entries()) {
            if (!playerSettingsState.raw.renderAllFloors.value && floorState.readonly.floorIndex !== i) continue;
            this.invalidate(floor);
        }
    }

    invalidateVisibleFloors(): void {
        let floorFound = false;
        for (const [i, floor] of floorState.readonly.floors.entries()) {
            if (!playerSettingsState.raw.renderAllFloors.value && floorState.readonly.floorIndex !== i) continue;
            if (floorFound) this.invalidateLight(floor.id);
            else this.invalidate(floor);
            if (floor === readonly.currentFloor) floorFound = true;
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
            } else if (layer.name === "map" && playerSettingsState.raw.renderAllFloors.value) {
                layer.invalidate(true);
            }
        }
    }

    invalidateLightAllFloors(): void {
        for (const [f, floor] of floorState.readonly.floors.entries()) {
            if (f > floorState.readonly.floorIndex) return;
            this.invalidateLight(floor.id);
        }
    }

    invalidateSectors(): void {
        for (const floor of floorState.readonly.floors.values()) {
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
