import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

import AssetManager from "./assetManager/AssetManager.vue";
import Login from "./auth/Login.vue";
import { Logout } from "./auth/logout";
import { baseAdjustedFetch } from "./core/utils";
import Dashboard from "./dashboard/Dashboard.vue";
import Game from "./game/Game.vue";
import Invitation from "./invitation";
import { handleNotifications } from "./notifications";
import { coreStore } from "./store/core";
import { BASE_PATH } from "./utils";

const routes: Array<RouteRecordRaw> = [
    {
        path: "/",
        redirect: "/dashboard",
    },
    {
        path: "/assets/:folder*",
        component: AssetManager,
        name: "assets",
        meta: {
            auth: true,
        },
    },
    {
        path: "/auth/login",
        component: Login,
    },
    {
        path: "/auth/logout",
        component: Logout,
    },
    {
        path: "/dashboard",
        name: "dashboard",
        component: Dashboard,
        meta: {
            auth: true,
        },
    },
    {
        path: "/invite/:code",
        component: Invitation,
        meta: {
            auth: true,
        },
    },
    {
        path: "/game/:creator/:room",
        component: Game,
        name: "game",
        meta: {
            auth: true,
        },
    },
];

export const router = createRouter({
    history: createWebHistory(BASE_PATH),
    routes,
});

router.beforeEach(async (to, _from, next) => {
    // disable for now as it gives a flicker on transition between login and dashboard.
    // coreStore.setLoading(true);
    if (!coreStore.state.initialized) {
        // Launch core requests
        const promiseArray = [baseAdjustedFetch("/api/auth"), baseAdjustedFetch("/api/version")];

        // Launch extra requests (changelog & notifications)
        baseAdjustedFetch("/api/changelog").then(async (response) => {
            const data = await response.json();
            coreStore.setChangelog(data.changelog);
        });
        baseAdjustedFetch("/api/notifications").then(async (response) => {
            const data = await response.json();
            handleNotifications(data);
        });

        // Handle core requests
        const [authResponse, versionResponse] = await Promise.all(promiseArray);
        if (authResponse.ok && versionResponse.ok) {
            const authData: { auth: boolean; username: string; email: string } = await authResponse.json();
            const versionData = await versionResponse.json();
            if (authData.auth) {
                coreStore.setAuthenticated(true);
                coreStore.setUsername(authData.username);
                coreStore.setEmail(authData.email);
            }
            coreStore.setVersion(versionData);
            coreStore.setInitialized(true);
            router.push(to.path);
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
