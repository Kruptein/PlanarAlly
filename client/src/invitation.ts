import { defineComponent } from "vue";
import type { RouteLocationNormalized } from "vue-router";

import { http } from "./core/http";

export default defineComponent({
    async beforeRouteEnter(to: RouteLocationNormalized) {
        const response = await http.postJson("/api/invite", {
            code: to.params.code,
        });
        if (response.ok) {
            const data = (await response.json()) as { sessionUrl: string };
            return { path: data.sessionUrl };
        } else {
            console.error("Invitation code could not be redeemed");
            return { path: "/dashboard" };
        }
    },
});
