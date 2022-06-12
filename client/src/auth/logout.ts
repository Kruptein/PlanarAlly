import { defineComponent } from "vue";

import { http } from "../core/http";
import { coreStore } from "../store/core";

export const Logout = defineComponent({
    // eslint-disable-next-line vue/multi-word-component-names
    name: "Logout",
    async beforeRouteEnter(_to, _from, next) {
        await http.postJson("/api/logout");
        coreStore.setAuthenticated(false);
        coreStore.setUsername("");
        next({ path: "/auth/login" });
    },
});
