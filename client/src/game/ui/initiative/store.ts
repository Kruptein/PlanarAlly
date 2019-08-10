import { socket } from "@/assetManager/socket";
import { InitiativeData } from "@/game/comm/types/general";
import { rootStore } from "@/store";
import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

export interface InitiativeState {
    data: InitiativeData[];
    currentActor: string | null;
    roundCounter: number;
}

@Module({ dynamic: true, store: rootStore, name: "initiative", namespaced: true })
class InitiativeStore extends VuexModule implements InitiativeState {
    data: InitiativeData[] = [];
    currentActor: string | null = null;
    roundCounter = 0;

    contains(uuid: string): boolean {
        return this.data.some(d => d.uuid === uuid);
    }

    syncInitiative(data: InitiativeData | { uuid: string }): void {
        socket.emit("Initiative.Update", data);
    }

    @Mutation
    clear(): void {
        this.data = [];
        this.currentActor = null;
    }

    @Mutation
    setData(data: InitiativeData[]): void {
        this.data = data;
    }

    @Mutation
    addInitiative(data: InitiativeData): void {
        const d = this.data.findIndex(a => a.uuid === data.uuid);
        if (d >= 0) return;
        if (data.initiative === undefined) data.initiative = 0;
        this.syncInitiative(data);
    }

    @Mutation
    setRoundCounter(round: number): void {
        this.roundCounter = round;
    }

    @Mutation
    setTurn(actorId: string | null): void {
        this.currentActor = actorId;
    }
}

export const initiativeStore = getModule(InitiativeStore);
