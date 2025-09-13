import { createRouter, createWebHistory, type NavigationGuardNext, type RouteLocationNormalized } from "vue-router";

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
        
        // Check version response first (this should always succeed)
        if (!versionResponse!.ok) {
            console.error("Version check failed.");
            checkLogin(next, to);
            return;
        }
        
        const versionData = (await versionResponse!.json()) as { release: string; env: string };
        coreStore.setVersion(versionData);
        
        // Handle auth response (401 is expected for non-authenticated users)
        if (authResponse!.ok) {
            const authData = (await authResponse!.json()) as { auth: boolean; username: string; email: string };
            coreStore.setAuthenticated(authData.auth);
            coreStore.setInitialized(true);

            if (authData.auth) {
                coreStore.setUsername(authData.username);
                coreStore.setEmail(authData.email);
                next();
            } else {
                checkLogin(next, to);
            }
        } else if (authResponse!.status === 401) {
            // 401 is expected for non-authenticated users - not an error
            coreStore.setAuthenticated(false);
            coreStore.setInitialized(true);
            checkLogin(next, to);
        } else {
            // Other auth errors (500, network issues, etc.)
            console.error("Authentication check failed with status:", authResponse!.status);
            coreStore.setInitialized(true);
            checkLogin(next, to);
        }
    } else {
        checkLogin(next, to);
    }
});

function checkLogin(next: NavigationGuardNext, to: RouteLocationNormalized): void {
    if (to.meta.auth === true && !coreStore.state.authenticated) {
        next({ name: "login", query: { redirect: to.path } });
    } else {
        next();
    }
}

router.afterEach((_to, _from) => {
    coreStore.setLoading(false);
});
