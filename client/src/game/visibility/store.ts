import { socket } from "@/game/api/socket";
import { rootStore } from "@/store";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
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
    visionBlockers: { floor: string; blockers: string[] }[] = [];
    movementBlockers: { floor: string; blockers: string[] }[] = [];
    visionSources: { floor: string; sources: { shape: string; aura: string }[] }[] = [];

    @Mutation
    setVisionMode(data: { mode: VisibilityMode; sync: boolean }): void {
        this.visionMode = data.mode;
        // eslint-disable-next-line @typescript-eslint/camelcase
        if (data.sync) socket.emit("Location.Options.Set", { vision_mode: VisibilityMode[data.mode] });
    }

    @Mutation
    recalculateVision(floor: string): void {
        if (this.visionMode === VisibilityMode.TRIANGLE) triangulate(TriangulationTarget.VISION, floor);
    }

    @Mutation
    recalculateMovement(floor: string): void {
        if (this.visionMode === VisibilityMode.TRIANGLE) triangulate(TriangulationTarget.MOVEMENT, floor);
    }

    @Mutation
    moveShape(data: { shape: Shape; oldFloor: string; newFloor: string }): void {
        if (data.shape.movementObstruction) {
            moveBlocker(TriangulationTarget.MOVEMENT, data.shape.uuid, data.oldFloor, data.newFloor);
        }
        if (data.shape.visionObstruction) {
            moveBlocker(TriangulationTarget.VISION, data.shape.uuid, data.oldFloor, data.newFloor);
        }
        moveVisionSource(data.shape.uuid, data.shape.auras, data.oldFloor, data.newFloor);
    }

    @Mutation
    deleteFromTriag(data: { target: TriangulationTarget; shape: Shape }): void {
        if (this.visionMode === VisibilityMode.TRIANGLE_ITERATIVE) deleteShapeFromTriag(data.target, data.shape);
    }

    @Mutation
    addToTriag(data: { target: TriangulationTarget; shape: Shape }): void {
        if (this.visionMode === VisibilityMode.TRIANGLE_ITERATIVE) addShapesToTriag(data.target, data.shape);
    }

    @Action
    clear(): void {
        (<any>this.context.state).visionBlockers = [];
        (<any>this.context.state).visionSources = [];
        (<any>this.context.state).movementBlockers = [];
    }
}

export const visibilityStore = getModule(VisibilityStore);
