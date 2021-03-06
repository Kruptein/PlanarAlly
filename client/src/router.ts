// import "./class-component-hooks";

import Vue from "vue";
import Router from "vue-router";

import AssetManager from "@/assetManager/AssetManager.vue";
import Login from "@/auth/login.vue";
import Logout from "@/auth/logout";
import { coreStore } from "@/core/store";
import Game from "@/game/Game.vue";
import Invitation from "@/invitation/invitation";
import Settings from "@/settings/settings.vue";

import { baseAdjustedFetch } from "./core/utils";
import Dashboard from "./dashboard/Dashboard.vue";
import { handleNotifications } from "./notifications";
import { BASE_PATH } from "./utils";

Vue.use(Router);

// import { AssetManager } from "./assetManager/assets";
// const AssetManager = () => import("./assetManager/assets").then(m => m.AssetManager);

export const router = new Router({
    mode: "history",
    base: BASE_PATH,
    routes: [
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
            path: "/auth",
            component: { template: "<router-view></router-view>" },
            children: [
                { path: "login", name: "login", component: Login },
                { path: "logout", component: Logout },
            ],
        },
        {
            path: "/invite/:code",
            component: Invitation,
            meta: {
                auth: true,
            },
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
            path: "/settings/:page?",
            name: "settings",
            component: Settings,
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
    ],
});

router.beforeEach(async (to, _from, next) => {
    // disable for now as it gives a flicker on transition between login and dashboard.
    // coreStore.setLoading(true);
    if (!coreStore.initialized) {
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
            const authData = await authResponse.json();
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
    } else if (to.matched.some((record) => record.meta.auth) && !coreStore.authenticated) {
        next({ path: "/auth/login", query: { redirect: to.path } });
    } else {
        next();
    }
});

router.afterEach((_to, _from) => {
    coreStore.setLoading(false);
});
