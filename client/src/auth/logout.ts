import Axios from "axios";
import Vue from "vue";
import Component from "vue-class-component";

import store from "@/store";
import { Route } from "vue-router";

@Component
export default class Logout extends Vue {
    beforeRouteEnter(to: Route, from: Route, next: ({}) => {}) {
        Axios.post("/api/logout").then(() => {
            store.commit("setAuthenticated", false);
            next({ path: "/auth/login" });
        });
    }
}
