import { socket } from "@/game/api/socket";
import { rootStore } from "@/store";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { Shape } from "../shapes/shape";
import { BoundingVolume } from "./bvh/bvh";
import { addShapesToTriag, deleteShapeFromTriag, triangulate, TriangulationTarget } from "./te/pa";

export interface VisibilityState {
    visionMode: "triangle-plus" | "triangle";
    visionBlockers: string[];
}

@Module({ dynamic: true, store: rootStore, name: "visibility", namespaced: true })
class VisibilityStore extends VuexModule implements VisibilityState {
    BV = Object.freeze(new BoundingVolume([]));

    visionMode: "triangle-plus" | "triangle" = "triangle";
    visionBlockers: string[] = [];
    movementblockers: string[] = [];
    visionSources: { shape: string; aura: string }[] = [];

    @Mutation
    setVisionMode(data: { mode: "triangle-plus" | "triangle"; sync: boolean }): void {
        this.visionMode = data.mode;
        // eslint-disable-next-line @typescript-eslint/camelcase
        if (data.sync) socket.emit("Location.Options.Set", { vision_mode: data.mode });
    }

    @Mutation
    recalculateVision(): void {
        if (this.visionMode === "triangle") triangulate(TriangulationTarget.VISION);
    }

    @Mutation
    recalculateMovement(): void {
        if (this.visionMode === "triangle") triangulate(TriangulationTarget.MOVEMENT);
    }

    @Mutation
    deleteFromTriag(data: { target: TriangulationTarget; shape: Shape }): void {
        if (this.visionMode === "triangle-plus") {
            deleteShapeFromTriag(data.target, data.shape);
        }
    }

    @Mutation
    addToTriag(data: { target: TriangulationTarget; shape: Shape }): void {
        if (this.visionMode === "triangle-plus") addShapesToTriag(data.target, data.shape);
    }

    @Action
    clear(): void {
        (<any>this.context.state).visionBlockers = [];
        (<any>this.context.state).visionSources = [];
        (<any>this.context.state).movementblockers = [];
        this.context.commit("recalculateVision");
        this.context.commit("recalculateMovement");
    }
}

export const visibilityStore = getModule(VisibilityStore);
