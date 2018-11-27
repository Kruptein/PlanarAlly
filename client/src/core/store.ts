import store from "@/store";

import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

export interface CoreState {
    authenticated: boolean;
    initialized: boolean;
}

@Module({ dynamic: true, store, name: "core" })
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

export default getModule(CoreStore);
