import Vue from "vue";
import Component from "vue-class-component";
import { Route } from "vue-router";
import { postFetch } from "@/core/utils";

@Component({ template: "" })
export default class Invitation extends Vue {
    async beforeRouteEnter(to: Route, from: Route, next: (nextInfo: { path: string }) => {}): Promise<void> {
        const response = await postFetch("/api/invite", {
            code: to.params.code,
        });
        if (response.ok) {
            next({ path: (await response.json()).sessionUrl });
        } else {
            console.error("Invitation code could not be redeemed");
            next({ path: "/dashboard" });
        }
    }
}
