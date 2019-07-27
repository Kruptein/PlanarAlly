import { socket } from "@/game/api/socket";
import { rootStore } from "@/store";
import { getModule, Module, Mutation, VuexModule, Action } from "vuex-module-decorators";
import { BoundingVolume } from "./bvh/bvh";
import { triangulate } from "./te/pa";

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
    recalculateVision(partial = false) {
        if (this.visionMode === "triangle") triangulate("vision", partial);
        else this.BV = Object.freeze(new BoundingVolume(this.visionBlockers));
    }

    @Mutation
    recalculateMovement(partial = false) {
        if (this.visionMode === "triangle") triangulate("movement", partial);
    }

    @Action
    clear() {
        (<any>this.context.state).visionBlockers = [];
        this.context.commit("recalculateVision");
        this.context.commit("recalculateMovement");
    }
}

export const visibilityStore = getModule(VisibilityStore);
