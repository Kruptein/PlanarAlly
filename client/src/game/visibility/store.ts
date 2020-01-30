import { socket } from "@/game/api/socket";
import { rootStore } from "@/store";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { triangulate, TriangulationTarget } from "./te/pa";

export enum VisibilityMode {
    TRIANGLE,
}

export interface VisibilityState {
    visionMode: VisibilityMode;
    visionBlockers: string[];
}

@Module({ dynamic: true, store: rootStore, name: "visibility", namespaced: true })
class VisibilityStore extends VuexModule implements VisibilityState {
    visionMode = VisibilityMode.TRIANGLE;
    visionBlockers: string[] = [];
    movementblockers: string[] = [];
    visionSources: { shape: string; aura: string }[] = [];

    @Mutation
    setVisionMode(data: { mode: VisibilityMode; sync: boolean }): void {
        this.visionMode = data.mode;
        // eslint-disable-next-line @typescript-eslint/camelcase
        if (data.sync) socket.emit("Location.Options.Set", { vision_mode: data.mode });
    }

    @Mutation
    recalculateVision(): void {
        triangulate(TriangulationTarget.VISION);
    }

    @Mutation
    recalculateMovement(): void {
        triangulate(TriangulationTarget.MOVEMENT);
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
