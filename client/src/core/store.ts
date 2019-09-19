import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import { rootStore } from "@/store";

export interface CoreState {
    authenticated: boolean;
    initialized: boolean;
    username: string;
}

@Module({ dynamic: true, store: rootStore, name: "core" })
class CoreStore extends VuexModule implements CoreState {
    authenticated = false;
    initialized = false;
    username = "";

    @Mutation
    setAuthenticated(auth: boolean): void {
        this.authenticated = auth;
    }

    @Mutation
    setInitialized(init: boolean): void {
        this.initialized = init;
    }

    @Mutation
    setUsername(username: string): void {
        this.username = username;
    }
}

export const coreStore = getModule(CoreStore);
