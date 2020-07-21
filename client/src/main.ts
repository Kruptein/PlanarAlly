import App from "@/App.vue";
import { router } from "@/router";
import { rootStore } from "@/store";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faDAndD, faDiscord, faGithub, faPatreon } from "@fortawesome/free-brands-svg-icons";
import { faCompass, faCopy, faWindowClose } from "@fortawesome/free-regular-svg-icons";
import {
    faArrowRight,
    faArrowsAlt,
    faChevronDown,
    faChevronRight,
    faChevronUp,
    faCircle,
    faCog,
    faDrawPolygon,
    faEdit,
    faExternalLinkAlt,
    faEye,
    faFolder,
    faLightbulb,
    faLock,
    faUnlock,
    faMinusSquare,
    faPaintBrush,
    faPencilAlt,
    faPlus,
    faPlusSquare,
    faShareAlt,
    faSignOutAlt,
    faSquare,
    faStopwatch,
    faSyncAlt,
    faTimesCircle,
    faTrashAlt,
    faUpload,
    faUserCircle,
    faUsers,
    faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import Vue from "vue";
import i18n from "./i18n";

library.add(
    faArrowRight,
    faArrowsAlt,
    faChevronDown,
    faChevronRight,
    faChevronUp,
    faCircle,
    faCog,
    faCopy,
    faCompass,
    faDAndD,
    faDiscord,
    faDrawPolygon,
    faEdit,
    faExternalLinkAlt,
    faEye,
    faFolder,
    faGithub,
    faLightbulb,
    faLock,
    faUnlock,
    faMinusSquare,
    faPaintBrush,
    faPatreon,
    faPencilAlt,
    faPlus,
    faPlusSquare,
    faShareAlt,
    faSignOutAlt,
    faSquare,
    faStopwatch,
    faSyncAlt,
    faTimesCircle,
    faTrashAlt,
    faUpload,
    faUsers,
    faUserCircle,
    faVideo,
    faWindowClose,
);
Vue.component("font-awesome-icon", FontAwesomeIcon);

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
