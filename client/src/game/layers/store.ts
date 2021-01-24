import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import { rootStore } from "../../store";
import { sendFloorReorder, sendRenameFloor } from "../api/emits/floor";

import { Floor } from "./floor";
import { Layer } from "./layer";
import { layerManager } from "./manager";

let FLOOR_ID = 0;

export function newFloorId(): number {
    return FLOOR_ID++;
}

export function getFloorId(name: string): number {
    return floorStore.floors.find((f) => f.name === name)?.id ?? -1;
}

export interface FloorState {
    currentFloorindex: number;
}

@Module({ dynamic: true, store: rootStore, name: "floor", namespaced: true })
class FloorStore extends VuexModule implements FloorState {
    private floorIndex = -1;
    private layerIndex = -1;
    private _floors: Floor[] = [];
    // the following should only be used during startup when loading floors in a different order
    private _indices: number[] = [];

    get floors(): readonly Floor[] {
        return this._floors;
    }

    get currentFloor(): Floor {
        return this.floors[this.floorIndex];
    }

    get currentFloorindex(): number {
        return this.floorIndex;
    }

    get currentLayerIndex(): number {
        return this.layerIndex;
    }

    get currentLayer(): Layer {
        return layerManager.getLayer(this.currentFloor)!;
    }

    @Mutation
    reset(): void {
        this._floors = [];
        this._indices = [];
        this.floorIndex = -1;
    }

    @Mutation
    setLayerIndex(index: number): void {
        this.layerIndex = index;
    }

    @Mutation
    addFloor(data: { floor: Floor; targetIndex?: number }): void {
        // We do some special magic here to allow out of order loading of floors on startup
        if (data.targetIndex !== undefined) {
            const index = data.targetIndex;
            const I = this._indices.findIndex((i) => i > index);
            if (I >= 0) {
                this._indices.splice(I, 0, data.targetIndex);
                this._floors.splice(I, 0, data.floor);
                if (I <= this.floorIndex) this.floorIndex += 1;
            } else {
                this._indices.push(data.targetIndex);
                this._floors.push(data.floor);
            }
        } else {
            this._floors.push(data.floor);
        }
        layerManager.addFloor(data.floor.id);
    }

    @Mutation
    renameFloor(data: { index: number; name: string; sync: boolean }): void {
        this._floors[data.index].name = data.name;
        if (data.index === this.floorIndex) layerManager.invalidateAllFloors();
        if (data.sync) sendRenameFloor({ ...data });
    }

    @Action
    removeFloor(floor: Floor): void {
        const index = this._floors.findIndex((f) => f === floor);
        this._floors.splice(index, 1);
        layerManager.removeFloor(floor.id);
        if (this.floorIndex === index) this.context.commit("selectFloor", { targetFloor: index - 1, sync: true });
    }

    @Mutation
    selectFloor(data: { targetFloor: Floor | number | string; sync: boolean }): void {
        let targetFloorIndex: number;
        if (typeof data.targetFloor === "string") {
            targetFloorIndex = floorStore.floors.findIndex((f) => f.name === data.targetFloor);
        } else if (typeof data.targetFloor === "number") {
            targetFloorIndex = data.targetFloor;
        } else {
            targetFloorIndex = floorStore.floors.findIndex((f) => f === data.targetFloor);
        }
        if (targetFloorIndex === this.floorIndex) return;
        this.floorIndex = targetFloorIndex;
        for (const [f, floor] of floorStore.floors.entries()) {
            for (const layer of layerManager.getLayers(floor)) {
                if (f > targetFloorIndex) layer.canvas.style.display = "none";
                else layer.canvas.style.removeProperty("display");
            }
        }
        layerManager.selectLayer(floorStore.currentLayer!.name, data.sync, false);
        layerManager.invalidateAllFloors();
    }

    @Mutation
    reorderFloors(data: { floors: string[]; sync: boolean }): void {
        const activeFloorName = this._floors[this.floorIndex].name;
        this._floors = data.floors.map((name) => this._floors.find((f) => f.name === name)!);
        this.floorIndex = this._floors.findIndex((f) => f.name === activeFloorName);
        if (data.sync) sendFloorReorder(data.floors);
    }
}

export const floorStore = getModule(FloorStore);
