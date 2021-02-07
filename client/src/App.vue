<script lang="ts">
import Loading from "vue-loading-overlay";
import { Component, Vue } from "vue-property-decorator";

import "vue-loading-overlay/dist/vue-loading.css";
import { coreStore } from "@/core/store";

import { BASE_PATH } from "./utils";

@Component({
    components: {
        Loading,
    },
})
export default class App extends Vue {
    get loading(): boolean {
        return coreStore.loading;
    }

    get backgroundImage(): string {
        return `url('${BASE_PATH}static/img/login_background.png')`;
    }
}
</script>

<template>
    <div id="app" :style="{ backgroundImage }">
        <loading :active.sync="loading" :is-full-page="true"></loading>
        <router-view ref="activeComponent"></router-view>
    </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css?family=Open+Sans");

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
</style>
