import axios, { AxiosResponse } from 'axios';
import Vue from "vue";
import VueRouter from "vue-router";

import Login from './auth/login.vue';
import DashBoard from './dashboard/main.vue'
import Game from './game/game.vue';
// const Game = () => import('./game/game.vue');
import store from './store';

const Initialize = Vue.component("Initialize", {
    data: () => ({
        message: "Loading...",
    }),
    template: "<div>{{ message }}</div>",
});

const router = new VueRouter({
    mode: 'history',
    routes: [
        {
            path: '/', redirect: '/dashboard',
        },
        {
            path: '/_load', component: Initialize,
        },
        {
            path: '/auth', component: { template: "<router-view></router-view>" },
            children: [
                { path: 'login', component: Login },
                {
                    path: 'logout',
                    beforeEnter: (to, from, next) => {
                        axios.post("/api/logout").then(() => {
                            store.commit("setAuthenticated", false);
                            next({ path: '/auth/login' });
                        });
                    }
                },
            ],
        },
        {
            path: '/dashboard', component: DashBoard,
            meta: {
                auth: true
            }
        },
        {
            path: '/game/:creator/:room', component: Game,
            meta: {
                auth: true
            }
        },
    ],
})

router.beforeEach(
    (to, from, next) => {
        if (!store.state.core.initialized && to.path !== '/_load') {
            next({ path: "/_load" });
            axios.get("/api/auth").then((response: AxiosResponse) => {
                if (response.data.auth)
                    store.commit("setAuthenticated", true);
                store.commit("setInitialized", true);
                router.push("/dashboard");
            }).catch(() => {
                console.log(0);
            })
        } else if (to.matched.some(record => record.meta.auth) && !store.state.core.authenticated) {
            next({ path: "/auth/login", query: { redirect: to.path } })
        } else {
            next()
        }
    }
)

export default router;