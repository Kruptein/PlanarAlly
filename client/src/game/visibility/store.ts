import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import { rootStore } from "@/store";

import { sendLocationOptions } from "../api/emits/location";
import { layerManager } from "../layers/manager";
import { Shape } from "../shapes/shape";

import { addShapesToTriag, deleteShapeFromTriag, triangulate, TriangulationTarget } from "./te/pa";
import { moveBlocker, moveVisionSource } from "./utils";

export enum VisibilityMode {
    TRIANGLE,
    TRIANGLE_ITERATIVE,
}

export interface VisibilityState {
    visionMode: VisibilityMode;
}

@Module({ dynamic: true, store: rootStore, name: "visibility", namespaced: true })
class VisibilityStore extends VuexModule implements VisibilityState {
    visionMode = VisibilityMode.TRIANGLE;
    visionBlockers: { floor: number; blockers: string[] }[] = [];
    movementBlockers: { floor: number; blockers: string[] }[] = [];
    visionSources: { floor: number; sources: { shape: string; aura: string }[] }[] = [];

    @Mutation
    setVisionMode(data: { mode: VisibilityMode; sync: boolean }): void {
        this.visionMode = data.mode;
        if (data.sync)
            sendLocationOptions({
                options: { vision_mode: VisibilityMode[data.mode] },
                location: null,
            });
    }

    @Mutation
    recalculate(data: { target: TriangulationTarget; floor: number }): void {
        if (this.visionMode === VisibilityMode.TRIANGLE) triangulate(data.target, data.floor);
    }

    @Mutation
    recalculateVision(floor: number): void {
        if (this.visionMode === VisibilityMode.TRIANGLE) triangulate(TriangulationTarget.VISION, floor);
    }

    @Mutation
    recalculateMovement(floor: number): void {
        if (this.visionMode === VisibilityMode.TRIANGLE) triangulate(TriangulationTarget.MOVEMENT, floor);
    }

    @Mutation
    moveShape(data: { shape: Shape; oldFloor: number; newFloor: number }): void {
        if (data.shape.movementObstruction) {
            moveBlocker(TriangulationTarget.MOVEMENT, data.shape.uuid, data.oldFloor, data.newFloor, true);
        }
        if (data.shape.visionObstruction) {
            moveBlocker(TriangulationTarget.VISION, data.shape.uuid, data.oldFloor, data.newFloor, true);
        }
        moveVisionSource(data.shape.uuid, data.shape.getAuras(true), data.oldFloor, data.newFloor);
    }

    @Mutation
    deleteFromTriag(data: { target: TriangulationTarget; shape: string }): void {
        if (this.visionMode === VisibilityMode.TRIANGLE_ITERATIVE) {
            const shape = layerManager.UUIDMap.get(data.shape);
            if (shape) deleteShapeFromTriag(data.target, shape);
        }
    }

    @Mutation
    addToTriag(data: { target: TriangulationTarget; shape: string }): void {
        if (this.visionMode === VisibilityMode.TRIANGLE_ITERATIVE) {
            const shape = layerManager.UUIDMap.get(data.shape);
            if (shape) addShapesToTriag(data.target, shape);
        }
    }

    @Action
    clear(): void {
        (this.context.state as any).visionBlockers = [];
        (this.context.state as any).visionSources = [];
        (this.context.state as any).movementBlockers = [];
    }
}

export const visibilityStore = getModule(VisibilityStore);
