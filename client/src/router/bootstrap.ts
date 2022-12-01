/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { RouteRecordRaw } from "vue-router";

import { Logout } from "../auth/logout";
import Invitation from "../invitation";

import { router } from ".";

// Auth
const Login = () => import("../auth/Login.vue");
// Dashboard
const DashboardSettings = () => import("../dashboard/Settings.vue");
const DashboardGames = () => import("../dashboard/games/GameList.vue");
const CreateGame = () => import("../dashboard/games/CreateGame.vue");
const Assets = () => import("../dashboard/Assets.vue");
const Dashboard = () => import("../dashboard/Dashboard.vue");
// Main game
const Game = () => import("../game/Game.vue");

const routes: Array<RouteRecordRaw> = [
    {
        path: "/",
        redirect: "/dashboard",
    },
    {
        path: "/auth",
        children: [
            {
                path: "login",
                component: Login,
                name: "login",
            },
            {
                path: "logout",
                component: Logout,
            },
        ],
    },
    {
        path: "/dashboard",
        name: "dashboard",
        component: Dashboard,
        meta: {
            auth: true,
        },
        children: [
            {
                path: "",
                redirect: { name: "games" },
            },
            {
                path: "games",
                children: [
                    {
                        path: "",
                        redirect: { name: "games" },
                    },
                    {
                        path: "list",
                        name: "games",
                        component: DashboardGames,
                    },
                    {
                        path: "new",
                        children: [
                            {
                                path: "",
                                name: "create-game",
                                component: CreateGame,
                            },
                            {
                                path: "blank",
                                name: "create-blank-game",
                                component: CreateGame,
                            },
                        ],
                    },
                ],
            },
            {
                path: "/assets/:folder?",
                name: "assets",
                component: Assets,
            },
            {
                path: "settings",
                component: DashboardSettings,
                name: "dashboard-settings",
            },
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
