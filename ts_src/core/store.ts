import { Module, VuexModule, Mutation } from 'vuex-module-decorators';

@Module
export default class CoreStore extends VuexModule {
    authenticated = false;
    initialized = false;

    @Mutation setAuthenticated(auth: boolean) {
        this.authenticated = auth;
    }

    @Mutation setInitialized(init: boolean) {
        this.initialized = init;
    }
}