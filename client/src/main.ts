import Vue from "vue";

import { VueHammer } from "vue2-hammer";

import App from "@/App.vue";
import { router } from "@/router";
import { rootStore } from "@/store";

Vue.config.productionTip = false;
Vue.config.devtools = true;
Vue.config.performance = true;

Vue.use(VueHammer);

export const app = new Vue({
    router,
    store: rootStore,
    render: h => h(App),
}).$mount("#app");

(<any>window).app = app;
