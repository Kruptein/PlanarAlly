import Axios, { AxiosError, AxiosResponse } from "axios";
import Vue from "vue";
import Component from "vue-class-component";
import { Route } from "vue-router";

@Component({ template: "" })
export default class Initiative extends Vue {
    beforeRouteEnter(to: Route, from: Route, next: ({}) => {}) {
        Axios.post("/api/invite", {
            code: to.params.code,
        })
            .then((response: AxiosResponse) => {
                next({ path: response.data.sessionUrl });
            })
            .catch((error: AxiosError) => {
                console.error("Invitation code could not be redeemed");
                next({ path: "/dashboard" });
            });
    }
}
