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
const CreateSwitcher = () => import("../dashboard/games/CreateSwitcher.vue");
const CreateGame = () => import("../dashboard/games/CreateGame.vue");
const Assets = () => import("../dashboard/Assets.vue");
const Dashboard = () => import("../dashboard/Dashboard.vue");
const ImportGame = () => import("../dashboard/games/ImportGame.vue");
const ExportGame = () => import("../dashboard/games/ExportGame.vue");
// Main game
const Game = () => import("../game/Game.vue");

const routes: RouteRecordRaw[] = [
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
            {
                path: "callback",
                component : Login,
                name: "auth-callback",
            }
            
        ],
    },
    {
        path: "/dashboard",
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
                        path: "export",
                        name: "export-game",
                        component: ExportGame,
                    },
                    {
                        path: "new",
                        children: [
                            {
                                path: "",
                                name: "create-game",
                                component: CreateSwitcher,
                            },
                            {
                                path: "blank",
                                name: "create-blank-game",
                                component: CreateGame,
                            },
                            {
                                path: "import",
                                name: "import-game",
                                component: ImportGame,
                            },
                        ],
                    },
                ],
            },
            {
                path: "/assets/:folder*",
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
        path: "/admin",
        component: Admin,
        meta: {
            auth: true,
        },
        children: [
            {
                path: "",
                redirect: { name: "admin-users" },
            },
            {
                name: "admin-users",
                path: "/admin/users",
                component: AdminUsers,
                meta: {
                    adminSection: AdminSection.Users,
                },
            },
            {
                name: "admin-campaigns",
                path: "/admin/campaigns",
                component: AdminCampaigns,
                meta: {
                    adminSection: AdminSection.Campaigns,
                },
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
