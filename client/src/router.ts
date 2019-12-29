// import "./class-component-hooks";

import axios, { AxiosResponse } from "axios";
import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);
import AssetManager from "@/assetManager/manager.vue";
import Login from "@/auth/login.vue";
import Logout from "@/auth/logout";
import LoadComponent from "@/core/components/load.vue";
import Dashboard from "@/dashboard/main.vue";
import AccountSettings from "@/dashboard/settings.vue";
import Game from "@/game/game.vue";
import Invitation from "@/invitation/invitation";

import { coreStore } from "@/core/store";
// import { AssetManager } from "./assetManager/assets";
// const AssetManager = () => import("./assetManager/assets").then(m => m.AssetManager);

export const router = new Router({
    mode: "history",
    base: process.env.BASE_URL,
    routes: [
        {
            path: "/",
            redirect: "/dashboard",
        },
        {
            path: "/_load",
            name: "load",
            component: LoadComponent,
        },
        {
            path: "/assets",
            component: AssetManager,
            meta: {
                auth: true,
            },
        },
        {
            path: "/auth",
            component: { template: "<router-view></router-view>" },
            children: [
                { path: "login", component: Login },
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
            component: Dashboard,
            meta: {
                auth: true,
            },
        },
        {
            path: "/account",
            component: AccountSettings,
            meta: {
                auth: true,
            },
        },
        {
            path: "/game/:creator/:room",
            component: Game,
            meta: {
                auth: true,
            },
        },
    ],
});

router.beforeEach((to, from, next) => {
    if (!coreStore.initialized && to.path !== "/_load") {
        next({ path: "/_load" });
        axios
            .get("/api/auth")
            .then((response: AxiosResponse) => {
                if (response.data.auth) {
                    coreStore.setAuthenticated(true);
                    coreStore.setUsername(response.data.username);
                }
                coreStore.setInitialized(true);
                router.push(to.path);
            })
            .catch(() => {
                console.error("Authentication check could not be fulfilled.");
            });
    } else if (to.matched.some(record => record.meta.auth) && !coreStore.authenticated) {
        next({ path: "/auth/login", query: { redirect: to.path } });
    } else {
        next();
    }
});
