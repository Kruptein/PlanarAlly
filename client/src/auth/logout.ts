import Vue from "vue";
import Component from "vue-class-component";
import { Route, NavigationGuard } from "vue-router";

import { coreStore } from "@/core/store";
import { postFetch } from "@/core/utils";

Component.registerHooks(["beforeRouteEnter"]);

@Component({})
export default class Logout extends Vue {
    async beforeRouteEnter(to: Route, from: Route, next: Parameters<NavigationGuard>[2]): Promise<void> {
        await postFetch("/api/logout");
        coreStore.setAuthenticated(false);
        coreStore.setUsername("");
        next({ path: "/auth/login" });
    }
}
