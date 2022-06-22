import type { RouteRecordRaw } from "vue-router";

import Login from "../auth/Login.vue";
import { Logout } from "../auth/logout";
import Dashboard from "../dashboard/Dashboard.vue";
import Invitation from "../invitation";

import { router } from ".";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const AssetManager = () => import("../assetManager/AssetManager.vue");
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const Game = () => import("../game/Game.vue");

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
        name: "login", // name used for transition
    },
    {
        path: "/auth/logout",
        component: Logout,
    },
    {
        path: "/dashboard",
        name: "dashboard", // name used for transition
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

export function bootstrapRouter(): void {
    for (const route of routes) {
        router.addRoute(route);
    }
}
