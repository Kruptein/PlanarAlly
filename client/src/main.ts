import { dom, library } from "@fortawesome/fontawesome-svg-core";
import { faDAndD, faDiscord, faGithub, faPatreon } from "@fortawesome/free-brands-svg-icons";
import { faCompass, faCopy, faWindowClose } from "@fortawesome/free-regular-svg-icons";
import {
    faArchive,
    faArrowRight,
    faArrowsAlt,
    faAt,
    faChevronDown,
    faChevronLeft,
    faChevronRight,
    faChevronUp,
    faCircle,
    faCog,
    faDownload,
    faDrawPolygon,
    faEdit,
    faExclamation,
    faExternalLinkAlt,
    faEye,
    faFolder,
    faLanguage,
    faLightbulb,
    faLink,
    faLock,
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
    faUnlink,
    faUnlock,
    faUpload,
    faUserCircle,
    faUsers,
    faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import Vue from "vue";
import Toasted from "vue-toasted";

import App from "@/App.vue";
import { router } from "@/router";
import { rootStore } from "@/store";

import { baseAdjust } from "./core/utils";
import i18n from "./i18n";
import { registerScripts } from "./scripts";

library.add(
    faArchive,
    faArrowRight,
    faArrowsAlt,
    faAt,
    faChevronDown,
    faChevronLeft,
    faChevronRight,
    faChevronUp,
    faCircle,
    faCog,
    faCopy,
    faCompass,
    faDAndD,
    faDiscord,
    faDownload,
    faDrawPolygon,
    faEdit,
    faExclamation,
    faExternalLinkAlt,
    faEye,
    faFolder,
    faGithub,
    faLanguage,
    faLightbulb,
    faLink,
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
    faUnlink,
    faUpload,
    faUsers,
    faUserCircle,
    faVideo,
    faWindowClose,
);

dom.watch();

Vue.component("font-awesome-icon", FontAwesomeIcon);
Vue.use(Toasted, {
    iconPack: "fontawesome",
});

Vue.config.productionTip = false;
Vue.config.devtools = true;
Vue.config.performance = true;

Vue.mixin({
    methods: {
        baseAdjust: (url: string) => baseAdjust(url),
    },
});

registerScripts();

const app = new Vue({
    router,
    store: rootStore,
    i18n,
    render: (h) => h(App),
}).$mount("#app");

(window as any).app = app;
