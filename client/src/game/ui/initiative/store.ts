import { socket } from "@/game/api/socket";
import { InitiativeData } from "@/game/comm/types/general";
import { rootStore } from "@/store";
import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

export function inInitiative(uuid: string): boolean {
    return initiativeStore.data.some(d => d.uuid === uuid);
}

export interface InitiativeState {
    data: InitiativeData[];
    currentActor: string | null;
    roundCounter: number;
    editLock: boolean;
}

@Module({ dynamic: true, store: rootStore, name: "initiative", namespaced: true })
class InitiativeStore extends VuexModule implements InitiativeState {
    data: InitiativeData[] = [];
    dataNew: InitiativeData[] = [];
    currentActor: string | null = null;
    roundCounter = 0;
    editLock = false;

    @Mutation
    clear(): void {
        this.data = [];
        this.dataNew = [];
        this.currentActor = null;
    }

    @Mutation
    setCurrentActor(actor: string | null): void {
        this.currentActor = actor;
    }

    @Mutation
    setData(data: InitiativeData[]): void {
        if (this.editLock) this.dataNew = data;
        else this.data = data;
    }

    @Mutation
    addInitiative(data: InitiativeData): void {
        const d = this.data.findIndex(a => a.uuid === data.uuid);
        if (d >= 0) return;
        if (data.initiative === undefined) data.initiative = 0;
        socket.emit("Initiative.Update", data);
    }

    @Mutation
    setRoundCounter(round: number): void {
        this.roundCounter = round;
    }

    @Mutation
    setTurn(actorId: string | null): void {
        this.currentActor = actorId;
    }

    @Mutation
    setLock(lock: boolean): void {
        if (lock) this.dataNew = this.data;
        else this.data = this.dataNew;
        this.editLock = lock;
    }
}

export const initiativeStore = getModule(InitiativeStore);
