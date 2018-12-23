import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import { rootStore } from "@/store";

export interface CoreState {
    authenticated: boolean;
    initialized: boolean;
}

@Module({ dynamic: true, store: rootStore, name: "core" })
class CoreStore extends VuexModule {
    authenticated = false;
    initialized = false;
    username = "";

    @Mutation
    setAuthenticated(auth: boolean) {
        this.authenticated = auth;
    }

    @Mutation
    setInitialized(init: boolean) {
        this.initialized = init;
    }

    @Mutation
    setUsername(username: string) {
        this.username = username;
    }
}

export const coreStore = getModule(CoreStore);
