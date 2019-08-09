import { socket } from "@/game/api/socket";
import { rootStore } from "@/store";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { BoundingVolume } from "./bvh/bvh";
import { triangulate } from "./te/pa";

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
    recalculateVision(partial = false): void {
        if (this.visionMode === "triangle") triangulate("vision", partial);
        else this.BV = Object.freeze(new BoundingVolume(this.visionBlockers));
    }

    @Mutation
    recalculateMovement(partial = false): void {
        if (this.visionMode === "triangle") triangulate("movement", partial);
    }

    @Action
    clear(): void {
        (<any>this.context.state).visionBlockers = [];
        this.context.commit("recalculateVision");
        this.context.commit("recalculateMovement");
    }
}

export const visibilityStore = getModule(VisibilityStore);
