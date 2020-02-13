import { socket } from "@/game/api/socket";
import { rootStore } from "@/store";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { triangulate, TriangulationTarget } from "./te/pa";

export enum VisibilityMode {
    TRIANGLE,
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
        if (data.sync) socket.emit("Location.Options.Set", { vision_mode: data.mode });
    }

    @Mutation
    recalculateVision(floor: string): void {
        triangulate(TriangulationTarget.VISION, false, floor);
    }

    @Mutation
    recalculateMovement(floor: string): void {
        triangulate(TriangulationTarget.MOVEMENT, false, floor);
    }

    @Action
    clear(): void {
        (<any>this.context.state).visionBlockers = [];
        (<any>this.context.state).visionSources = [];
        (<any>this.context.state).movementBlockers = [];
    }
}

export const visibilityStore = getModule(VisibilityStore);
