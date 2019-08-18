import { socket } from "@/game/api/socket";
import { rootStore } from "@/store";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { Shape } from "../shapes/shape";
import { BoundingVolume } from "./bvh/bvh";
import { addShapesToTriag, deleteShapeFromTriag0, triangulate, TriangulationTarget, deleteShapeFromTriag } from "./te/pa";

export interface VisibilityState {
    visionMode: "bvh" | "triangle";
    visionBlockers: string[];
}

@Module({ dynamic: true, store: rootStore, name: "visibility", namespaced: true })
class VisibilityStore extends VuexModule implements VisibilityState {
    BV = Object.freeze(new BoundingVolume([]));

    visionMode: "bvh" | "triangle" = "bvh";
    visionBlockers: string[] = [];

    @Mutation
    setVisionMode(data: { mode: "bvh" | "triangle"; sync: boolean }): void {
        this.visionMode = data.mode;
        // eslint-disable-next-line @typescript-eslint/camelcase
        if (data.sync) socket.emit("Location.Options.Set", { vision_mode: data.mode });
    }

    @Mutation
    recalculateVision(): void {
        if (this.visionMode === "triangle") triangulate(TriangulationTarget.VISION);
        else this.BV = Object.freeze(new BoundingVolume(this.visionBlockers));
    }

    @Mutation
    recalculateMovement(): void {
        if (this.visionMode === "triangle") triangulate(TriangulationTarget.MOVEMENT);
    }

    @Mutation
    deleteFromTriag(data: { target: TriangulationTarget; shape: Shape; standalone: boolean }): void {
        if (this.visionMode === "triangle") {
            deleteShapeFromTriag(data.target, data.shape);
        } else if (data.standalone) {
            this.recalculateVision();
        }
    }

    @Mutation
    addToTriag(data: { target: TriangulationTarget; shape: Shape }): void {
        if (this.visionMode === "triangle") addShapesToTriag(data.target, data.shape);
        else this.recalculateVision();
    }

    @Action
    clear(): void {
        (<any>this.context.state).visionBlockers = [];
        this.context.commit("recalculateVision");
        this.context.commit("recalculateMovement");
    }
}

export const visibilityStore = getModule(VisibilityStore);
