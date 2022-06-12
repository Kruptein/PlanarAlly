<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { baseAdjust } from "./core/http";
import { coreStore } from "./store/core";

const route = useRoute();

const transitionName = ref("");
const webmError = ref(false);
const webmStart = 2 * Math.floor(Math.random() * 5);

const loading = computed(() => coreStore.state.loading);
const backgroundImage = `url('${import.meta.env.BASE_URL}static/img/login_background.png')`;

watch(
    () => route.name,
    (toRoute, fromRoute) => {
        if (fromRoute === "login" && toRoute === "dashboard") {
            transitionName.value = "slide-left";
        } else if (fromRoute === "dashboard" && toRoute === "login") {
            transitionName.value = "slide-right";
        } else {
            transitionName.value = "";
        }
    },
);
</script>

<template>
    <div id="app" :style="{ backgroundImage }">
        <div id="loading" v-if="transitionName === '' && loading">
            <video
                v-if="!webmError"
                autoplay
                loop
                muted
                playsinline
                style="height: 20vh"
                :src="baseAdjust('/static/img/loading.webm#t=' + webmStart)"
                @error="webmError = true"
            />
            <img v-else :src="baseAdjust('/static/img/loading.gif')" style="height: 20vh" />
        </div>
        <router-view v-slot="{ Component }">
            <transition :name="transitionName" mode="out-in">
                <component :is="Component" />
            </transition>
        </router-view>
    </div>
</template>

<style lang="scss">
@import "vue-toastification/dist/index.css";
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

    display: flex;
    background-repeat: repeat;
    background-attachment: fixed;

    #loading {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    svg {
        cursor: pointer;
    }
}

// don't move these inside the above or it will have higher specificity
a,
a:visited,
a:hover,
a:active {
    color: inherit;
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
