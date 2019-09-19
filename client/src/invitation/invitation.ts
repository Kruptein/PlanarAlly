import Axios, { AxiosError, AxiosResponse } from "axios";
import Vue from "vue";
import Component from "vue-class-component";
import { Route } from "vue-router";

@Component({ template: "" })
export default class Initiative extends Vue {
    beforeRouteEnter(to: Route, from: Route, next: (nextInfo: { path: string }) => {}): void {
        Axios.post("/api/invite", {
            code: to.params.code,
        })
            .then((response: AxiosResponse) => {
                next({ path: response.data.sessionUrl });
            })
            .catch((_error: AxiosError) => {
                console.error("Invitation code could not be redeemed");
                next({ path: "/dashboard" });
            });
    }
}
