import Vue from "vue";

import App from "@/App.vue";
import { router } from "@/router";
import { rootStore } from "@/store";
import i18n from "./i18n";

Vue.config.productionTip = false;
Vue.config.devtools = true;
Vue.config.performance = true;

export const app = new Vue({
    router,
    store: rootStore,
    i18n,
    render: h => h(App),
}).$mount("#app");

(<any>window).app = app;
