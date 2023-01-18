import { defineComponent } from "vue";
import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

import { http } from "./core/http";

export default defineComponent({
    async beforeRouteEnter(to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) {
        const response = await http.postJson("/api/invite", {
            code: to.params.code,
        });
        if (response.ok) {
            const data = (await response.json()) as { sessionUrl: string };
            next({ path: data.sessionUrl });
        } else {
            console.error("Invitation code could not be redeemed");
            next({ path: "/dashboard" });
        }
    },
});
