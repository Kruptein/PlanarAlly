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

    @Mutation
    setAuthenticated(auth: boolean) {
        this.authenticated = auth;
    }

    @Mutation
    setInitialized(init: boolean) {
        this.initialized = init;
    }
}

export const coreStore = getModule(CoreStore);
