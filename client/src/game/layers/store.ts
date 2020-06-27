import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { rootStore } from "../../store";
import { Floor } from "./floor";
import { layerManager } from "./manager";

export interface FloorState {
    currentFloorindex: number;
}

@Module({ dynamic: true, store: rootStore, name: "floor", namespaced: true })
class FloorStore extends VuexModule implements FloorState {
    private floorIndex = -1;
    private layerIndex = -1;
    private _floors: Floor[] = [];

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

    @Mutation
    reset(): void {
        this._floors = [];
        this.floorIndex = -1;
    }

    @Mutation
    setLayerIndex(index: number): void {
        this.layerIndex = index;
    }

    @Mutation
    addFloor(floor: Floor): void {
        this._floors.push(floor);
        layerManager.addFloor(floor.name);
    }

    @Action
    removeFloor(floor: Floor): void {
        const index = this._floors.findIndex(f => f === floor);
        this._floors.splice(index, 1);
        layerManager.removeFloor(floor.name);
        if (this.floorIndex === index) this.context.commit("selectFloor", { targetFloor: index - 1, sync: true });
    }

    @Mutation
    selectFloor(data: { targetFloor: Floor | number | string; sync: boolean }): void {
        let targetFloorIndex: number;
        if (typeof data.targetFloor === "string") {
            targetFloorIndex = floorStore.floors.findIndex(f => f.name === data.targetFloor);
        } else if (typeof data.targetFloor === "number") {
            targetFloorIndex = data.targetFloor;
        } else {
            targetFloorIndex = floorStore.floors.findIndex(f => f === data.targetFloor);
        }
        if (targetFloorIndex === this.floorIndex) return;
        this.floorIndex = targetFloorIndex;
        for (const [f, floor] of floorStore.floors.entries()) {
            for (const layer of layerManager.getLayers(floor)) {
                if (f > targetFloorIndex) layer.canvas.style.display = "none";
                else layer.canvas.style.removeProperty("display");
            }
        }
        layerManager.selectLayer(layerManager.getLayer(floorStore.currentFloor)!.name, data.sync, false);
        layerManager.invalidateAllFloors();
    }
}

export const floorStore = getModule(FloorStore);

/*

reset(){this.layers = [];
        this.selectedLayerIndex = -1;}

@Mutation
    addLayer(name: string): void {
        this.layers.push(name);
        if (this.selectedLayerIndex === -1) this.selectedLayerIndex = this.layers.indexOf(name);
    }

    @Mutation
    selectLayer(data: { layer: Layer; sync: boolean }): void {
        let index = this.layers.indexOf(data.layer.name);
        if (index < 0) index = 0;
        // else if (index >= this.layers.reduce((acc: number, val: Layer) => val.floor === data.layer.floor))
        this.selectedLayerIndex = index;
        if (data.sync) socket.emit("Client.ActiveLayer.Set", { floor: data.layer.floor, layer: data.layer.name });
    }
    */
