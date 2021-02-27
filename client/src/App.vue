<script lang="ts">
import Loading from "vue-loading-overlay";
import { Component, Vue, Watch } from "vue-property-decorator";
import { Route } from "vue-router";

import "vue-loading-overlay/dist/vue-loading.css";
import { coreStore } from "@/core/store";

import { BASE_PATH } from "./utils";

@Component({
    components: {
        Loading,
    },
})
export default class App extends Vue {
    transitionName = "";

    get loading(): boolean {
        return coreStore.loading;
    }

    get backgroundImage(): string {
        return `url('${BASE_PATH}static/img/login_background.png')`;
    }

    @Watch("$route")
    onRouteChange(toRoute: Route, fromRoute: Route): void {
        if (fromRoute.name === "login" && toRoute.name === "dashboard") {
            this.transitionName = "slide-left";
        } else if (fromRoute.name === "dashboard" && toRoute.name === "login") {
            this.transitionName = "slide-right";
        } else {
            this.transitionName = "";
        }
    }
}
</script>

<template>
    <div id="app" :style="{ backgroundImage }">
        <loading v-if="transitionName === ''" :active.sync="loading" :is-full-page="true"></loading>
        <transition :name="transitionName" mode="out-in">
            <router-view ref="activeComponent"></router-view>
        </transition>
    </div>
</template>

<style>
@font-face {
    font-family: "Open Sans";
    src: local("OpenSans"), url("./core/fonts/OpenSans-Regular.ttf") format("truetype");
}

body {
    overscroll-behavior: contain;
}

html,
body,
#app {
    margin: 0;
    padding: 0;
    border: 0;
    width: 100%;
    height: 100%;
    font-family: "Open Sans", sans-serif;
    font-weight: 200;
}

#app {
    display: flex;
    background-repeat: repeat;
    background-attachment: fixed;
}

.toasted > svg:first-child {
    margin-right: 0.7rem;
}

body .toasted-container.top-left {
    top: 1%;
    left: 3%;
}

.slide-right-leave-active,
.slide-left-leave-active {
    transition: 0.5s ease-in-out;
}

.slide-left-leave-to {
    transform: translateX(-80vw);
}

.slide-right-leave-to {
    transform: translateX(80vw);
}
</style>
