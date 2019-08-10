import { socket } from "@/game/api/socket";
import { rootStore } from "@/store";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { BoundingVolume } from "./bvh/bvh";
import { addShapeToTriag, deleteShapeFromTriag, triangulate, TriangulationTarget } from "./te/pa";
import { Vertex } from "./te/tds";

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
    deleteFromTriag(data: { target: TriangulationTarget; vertices: Vertex[]; standalone: boolean }): void {
        if (this.visionMode === "triangle") {
            deleteShapeFromTriag(data.target, data.vertices);
        } else if (data.standalone) {
            this.recalculateVision();
        }
    }

    @Mutation
    addToTriag(data: { target: TriangulationTarget; points: number[][] }): void {
        if (this.visionMode === "triangle") addShapeToTriag(data.target, data.points);
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
