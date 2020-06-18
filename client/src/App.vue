<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Loading from "vue-loading-overlay";
import "vue-loading-overlay/dist/vue-loading.css";
import { coreStore } from "@/core/store";

@Component({
    components: {
        Loading,
    },
})
export default class App extends Vue {
    get loading(): boolean {
        return coreStore.loading;
    }
}
</script>

<template>
    <div id="app">
        <loading :active.sync="loading" :is-full-page="true"></loading>
        <router-view ref="activeComponent"></router-view>
    </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css?family=Open+Sans");

body {
    overscroll-behavior: contain;
    overflow: hidden;
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
    background: url("/static/img/login_background.png") repeat fixed;
}
</style>
