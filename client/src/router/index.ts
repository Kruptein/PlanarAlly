import { createRouter, createWebHistory } from "vue-router";

import { http } from "../core/http";
import { handleNotifications } from "../notifications";
import { coreStore } from "../store/core";

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [],
});

router.beforeEach(async (to, _from, next) => {
    // disable for now as it gives a flicker on transition between login and dashboard.
    // coreStore.setLoading(true);
    if (!coreStore.state.initialized) {
        // Launch core requests
        const promiseArray = [http.get("/api/auth"), http.get("/api/version")];

        // Launch extra requests (changelog & notifications)
        http.get("/api/changelog")
            .then(async (response) => {
                const data = (await response.json()) as { changelog: string };
                coreStore.setChangelog(data.changelog);
            })
            .catch(() => console.warn("Failed to retrieve changelog"));
        http.get("/api/notifications")
            .then(async (response) => {
                const data = (await response.json()) as { uuid: string; message: string }[];
                handleNotifications(data);
            })
            .catch(() => console.warn("Failed to retrieve notifications"));

        // Handle core requests
        const [authResponse, versionResponse] = await Promise.all(promiseArray);
        if (authResponse!.ok && versionResponse!.ok) {
            const authData = (await authResponse!.json()) as { auth: boolean; username: string; email: string };
            const versionData = (await versionResponse!.json()) as { release: string; env: string };
            if (authData.auth) {
                coreStore.setAuthenticated(true);
                coreStore.setUsername(authData.username);
                coreStore.setEmail(authData.email);
            }
            coreStore.setVersion(versionData);
            coreStore.setInitialized(true);
            await router.push(to.path);
            next();
        } else {
            console.error("Authentication check could not be fulfilled.");
        }
    } else if (to.matched.some((record) => record.meta.auth) && !coreStore.state.authenticated) {
        next({ path: "/auth/login", query: { redirect: to.path } });
    } else {
        next();
    }
});

router.afterEach((_to, _from) => {
    coreStore.setLoading(false);
});
