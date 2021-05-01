import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { createApp } from "vue";
import Toast, { PluginOptions, POSITION } from "vue-toastification";

import App from "./App.vue";
import { PlanarAllyModalsPlugin } from "./core/plugins/modals/plugin";
import { loadFontAwesome } from "./fa";
import { i18n } from "./i18n";
import { router } from "./router";

loadFontAwesome();

const toastOptions: PluginOptions = {
    position: POSITION.BOTTOM_RIGHT,
};

const app = createApp(App);
app.use(router)
    .use(i18n)
    .use(Toast, toastOptions)
    .use(PlanarAllyModalsPlugin)
    .component("font-awesome-icon", FontAwesomeIcon)
    .mount("body");
