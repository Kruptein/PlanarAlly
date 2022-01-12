import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { state } from "./store";

const TokenLogin = () => import("./components/TokenLogin.vue");
const Campaigns = () => import("./components/Campaigns.vue");
const Users = () => import("./components/Users.vue");

const routes: Array<RouteRecordRaw> = [
    {
        path: "/",
        component: TokenLogin,
    },
    {
        path: "/users",
        component: Users,
        meta: {
            auth: true,
        },
    },
    {
        path: "/campaigns",
        component: Campaigns,
        meta: {
            auth: true,
        },
    },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, from, next) => {
    if (
        to.matched.some((record) => record.meta.auth) &&
        state.access_token === undefined
    ) {
        next({ path: "/", query: { redirect: to.path } });
    } else {
        next();
    }
});
