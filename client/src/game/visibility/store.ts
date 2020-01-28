import { socket } from "@/game/api/socket";
import { rootStore } from "@/store";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { BoundingVolume } from "./bvh/bvh";
import { triangulate, TriangulationTarget } from "./te/pa";

export interface VisibilityState {
    visionMode: "bvh" | "triangle";
}

@Module({ dynamic: true, store: rootStore, name: "visibility", namespaced: true })
class VisibilityStore extends VuexModule implements VisibilityState {
    BV = Object.freeze(new BoundingVolume([]));

    visionMode: "bvh" | "triangle" = "bvh";
    visionBlockers: { floor: string; blockers: string[] }[] = [];
    movementBlockers: { floor: string; blockers: string[] }[] = [];
    visionSources: { floor: string; sources: { shape: string; aura: string }[] }[] = [];

    @Mutation
    setVisionMode(data: { mode: "bvh" | "triangle"; sync: boolean }): void {
        this.visionMode = data.mode;
        // eslint-disable-next-line @typescript-eslint/camelcase
        if (data.sync) socket.emit("Location.Options.Set", { vision_mode: data.mode });
    }

    @Mutation
    recalculateVision(floor: string): void {
        if (this.visionMode === "triangle") triangulate(TriangulationTarget.VISION, false, floor);
        // else this.BV = Object.freeze(new BoundingVolume(getVisionBlockers(floor)));
    }

    @Mutation
    recalculateMovement(floor: string): void {
        if (this.visionMode === "triangle") triangulate(TriangulationTarget.MOVEMENT, false, floor);
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
