import { getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import { rootStore } from "@/store";

export interface CoreState {
    authenticated: boolean;
    initialized: boolean;
    username: string;
    email?: string;
    version: { release: string; env: string };
    changelog: string;
}

@Module({ dynamic: true, store: rootStore, name: "core" })
class CoreStore extends VuexModule implements CoreState {
    authenticated = false;
    initialized = false;
    username = "";
    email: string | undefined = undefined;
    loading = false;
    version = { release: "", env: "" };
    changelog = "";

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

    @Mutation
    setEmail(email: string): void {
        this.email = email;
    }

    @Mutation
    setLoading(loading: boolean): void {
        this.loading = loading;
    }

    @Mutation
    setVersion(version: { release: string; env: string }): void {
        this.version = version;
    }

    @Mutation
    setChangelog(changelog: string): void {
        this.changelog = changelog;
    }
}

export const coreStore = getModule(CoreStore);
