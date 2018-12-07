import Vue from "vue";

import App from "@/App.vue";
import { router } from "@/router";
import { rootStore } from "@/store";

Vue.config.productionTip = false;
Vue.config.devtools = true;
Vue.config.performance = true;

export const app = new Vue({
    router,
    store: rootStore,
    render: h => h(App),
}).$mount("#app");

(<any>window).app = app;
