import { socket } from "@/game/api/socket";
import { rootStore } from "@/store";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { Shape } from '../shapes/shape';
import { BoundingVolume } from "./bvh/bvh";
import { addShapeToTriag, deleteShapeFromTriag, triangulate, TriangulationTarget } from "./te/pa";

export interface VisibilityState {}

@Module({ dynamic: true, store: rootStore, name: "visibility", namespaced: true })
class VisibilityStore extends VuexModule implements VisibilityState {
    BV = Object.freeze(new BoundingVolume([]));

    visionMode: "bvh" | "triangle" = "bvh";
    visionBlockers: string[] = [];

    @Mutation
    setVisionMode(data: { mode: "bvh" | "triangle"; sync: boolean }) {
        this.visionMode = data.mode;
        if (data.sync) socket.emit("Location.Options.Set", { vision_mode: data.mode });
    }

    @Mutation
    recalculateVision() {
        if (this.visionMode === "triangle") triangulate(TriangulationTarget.VISION);
        else this.BV = Object.freeze(new BoundingVolume(this.visionBlockers));
    }

    @Mutation
    recalculateMovement() {
        if (this.visionMode === "triangle") triangulate(TriangulationTarget.MOVEMENT);
    }

    @Mutation
    deleteFromTriag(data: { target: TriangulationTarget; shape: Shape; standalone: boolean }) {
        if (this.visionMode === "triangle") {
            deleteShapeFromTriag(data.target, data.shape);
        } else if (data.standalone) {
            this.recalculateVision();
        }
    }

    @Mutation
    addToTriag(data: { target: TriangulationTarget; points: number[][] }) {
        if (this.visionMode === "triangle") addShapeToTriag(data.target, data.points);
        else this.recalculateVision();
    }

    @Action
    clear() {
        (<any>this.context.state).visionBlockers = [];
        this.context.commit("recalculateVision");
        this.context.commit("recalculateMovement");
    }
}

export const visibilityStore = getModule(VisibilityStore);
