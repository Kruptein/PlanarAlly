// import "./class-component-hooks";

import axios, { AxiosResponse } from "axios";
import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);

import Login from "@/auth/login.vue";
import Logout from "@/auth/logout";
import Load from "@/core/components/load.vue";
import coreStore from "@/core/store";
import DashBoard from "@/dashboard/main.vue";
import Game from "@/game/game.vue";

const router = new Router({
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
            component: Load,
        },
        {
            path: "/auth",
            component: { template: "<router-view></router-view>" },
            children: [{ path: "login", component: Login }, { path: "logout", component: Logout }],
        },
        {
            path: "/dashboard",
            component: DashBoard,
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
                if (response.data.auth) coreStore.setAuthenticated(true);
                coreStore.setInitialized(true);
                router.push("/dashboard");
            })
            .catch(() => {
                console.log(0);
            });
    } else if (to.matched.some(record => record.meta.auth) && !coreStore.authenticated) {
        next({ path: "/auth/login", query: { redirect: to.path } });
    } else {
        next();
    }
});

export default router;
