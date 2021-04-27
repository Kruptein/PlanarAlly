<script lang="ts">
import SwiperCore, { Pagination } from "swiper/core";
import { Swiper, SwiperSlide } from "swiper/vue";
import { defineComponent, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";

import LanguageDropdown from "../core/components/LanguageDropdown.vue";
import { baseAdjust, getErrorReason, postFetch } from "../core/utils";
import { coreStore } from "../store/core";

SwiperCore.use([Pagination]);

export default defineComponent({
    components: { LanguageDropdown, Swiper, SwiperSlide },
    setup() {
        const { t } = useI18n();
        const route = useRoute();
        const router = useRouter();
        const toast = useToast();

        const username = ref("");
        const password = ref("");
        const email = ref("");
        const registerMode = ref(false);

        const showLanguageDropdown = ref(false);

        async function submit(): Promise<void> {
            if (registerMode.value) await register();
            else await login();
        }

        async function login(): Promise<void> {
            const response = await postFetch("/api/login", {
                username: username.value,
                password: password.value,
            });
            if (response.ok) {
                coreStore.setUsername(username.value);
                coreStore.setAuthenticated(true);
                const data: { email?: string } = await response.json();
                if (data.email !== undefined) coreStore.setEmail(data.email);
                router.push((route.query.redirect as string) ?? "/");
            } else {
                toast.error(await getErrorReason(response));
            }
        }
        async function register(): Promise<void> {
            const response = await postFetch("/api/register", {
                username: username.value,
                password: password.value,
                email: email.value,
            });
            if (response.ok) {
                coreStore.setUsername(username.value);
                coreStore.setAuthenticated(true);
                router.push((route.query.redirect as string) ?? "/");
            } else {
                toast.error(await getErrorReason(response));
            }
        }

        function focusin(event: { target?: { nextElementSibling?: HTMLElement } }): void {
            if (event.target && event.target.nextElementSibling) {
                const span = event.target.nextElementSibling;
                span.style.opacity = "0";
            }
        }

        function focusout(event: { target?: { nextElementSibling?: HTMLElement } }): void {
            if (event.target && event.target.nextElementSibling) {
                const span = event.target.nextElementSibling;
                span.style.opacity = "1";
            }
        }

        function slideNext(swiper: Swiper): void {
            swiper.slideNext();
        }

        return {
            baseAdjust,
            email,
            focusin,
            focusout,
            slideNext,
            password,
            registerMode,
            showLanguageDropdown,
            submit,
            t,
            username,
        };
    },
});
</script>

<template>
    <div id="page">
        <main>
            <div id="intro">
                <span>Welcome to Planar</span>
                <span style="color: #7c253e">Ally</span>
                !
            </div>
            <div id="description">
                PlanarAlly is an opensource virtual tabletop that aims to help you and your players discover the various
                fictive worlds out there.
            </div>
            <swiper
                class="swiper"
                :pagination="{ clickable: true, el: '.swiper-pagination', type: 'bullets' }"
                :slides-per-view="1"
                :loop="true"
                @click="slideNext"
            >
                <swiper-slide>
                    <video
                        autoplay="autoplay"
                        loop="loop"
                        muted="muted"
                        :poster="baseAdjust('/static/img/carousel_vision.png')"
                    >
                        <source src="https://planarally.io/assets/media/vision.8eab5657.webm" type="video/webm" />
                        <source src="https://planarally.io/assets/media/vision.06d14f50.mp4" type="video/mp4" />
                    </video>
                    <div class="carousel-details">Immersive lighting & vision system</div>
                </swiper-slide>
                <swiper-slide>
                    <video
                        autoplay="autoplay"
                        loop="loop"
                        muted="muted"
                        :poster="baseAdjust('/static/img/carousel_floors.png')"
                    >
                        <source src="https://www.planarally.io/assets/0.19.0/floors.webm" type="video/webm" />
                        <source src="https://www.planarally.io/assets/0.19.0/floors.mp4" type="video/mp4" />
                    </video>
                    <div class="carousel-details">Use floors to enhance immersion</div>
                </swiper-slide>
                <div class="swiper-pagination"></div>
            </swiper>
        </main>
        <footer>
            Need help? Visit our user documentation over on
            <a href="https://planarally.io" target="blank">planarally.io</a>
            or join the community on
            <a href="https://discord.gg/mubGnTe" target="blank">discord!</a>
        </footer>
        <div id="login-panel">
            <div id="language-selector">
                <font-awesome-icon icon="language" @click="showLanguageDropdown = !showLanguageDropdown" />
            </div>
            <LanguageDropdown id="language-dropdown" v-if="showLanguageDropdown" />
            <div id="logo">
                <img :src="baseAdjust('/static/favicon.png')" alt="PA logo" />
            </div>
            <form @focusin="focusin" @focusout="focusout" @submit.prevent="submit">
                <label v-t="'common.username'"></label>
                <div class="input">
                    <input
                        id="username"
                        type="text"
                        name="username"
                        v-model="username"
                        :placeholder="t('common.username')"
                        autocomplete="username"
                        required
                        autofocus
                    />
                    <span>
                        <font-awesome-icon icon="user-circle" />
                    </span>
                </div>
                <label v-t="'common.password'"></label>
                <div class="input">
                    <input
                        id="password"
                        type="password"
                        name="password"
                        v-model="password"
                        :placeholder="t('common.password')"
                        autocomplete="current-password"
                        required
                    />
                    <span>
                        <font-awesome-icon icon="lock" />
                    </span>
                </div>
                <template v-if="registerMode">
                    <label>Email (optional)</label>
                    <div class="input">
                        <input
                            id="email"
                            type="email"
                            name="email"
                            v-model="email"
                            :placeholder="t('settings.AccountSettings.email')"
                            autocomplete="email"
                        />
                        <span>
                            <font-awesome-icon icon="at" />
                        </span>
                    </div>
                </template>
                <button id="login" type="submit" name="login" class="submit" :title="t('auth.login.login')">
                    <span v-if="registerMode">sign up</span>
                    <span v-else>enter</span>
                </button>
            </form>
            <h4><span>OR</span></h4>
            <button class="submit" @click="registerMode = !registerMode" :title="t('auth.login.register')">
                <span v-if="registerMode">return</span>
                <span v-else>register</span>
            </button>
        </div>
    </div>
</template>

<style lang="scss">
@import "~swiper/swiper.scss";
@import "~swiper/components/pagination/pagination.scss";

.swiper-pagination-bullet-active {
    background-color: var(--primary);
}

.swiper {
    margin-top: 60px;
    width: calc(80vw - 20em);
    min-width: 0;

    video {
        height: 50vh;
    }

    .swiper-slide {
        min-width: 0;
        width: calc(80vw - 20em);
        display: flex !important;
        flex-direction: column;
        align-items: center;
    }

    .carousel-details {
        font-weight: bold;
        font-size: 30px;
        margin-top: 10px;
        margin-bottom: 30px;

        em {
            font-weight: bold;
            text-decoration: underline;
            font-size: x-large;
            display: block;
            margin-bottom: 0.5em;
        }
    }
}
</style>

<style scoped lang="scss">
* {
    box-sizing: border-box;
}

#page {
    display: grid;
    grid-template-areas:
        "server   login"
        "carousel login"
        "footer   login";
    --primary: #7c253e;
    --secondary: #9c455e;
    --primaryBG: rgb(43, 43, 43);
    --secondaryBG: #c4c4c4;
    background-color: var(--secondaryBG);
    grid-template-columns: minmax(0, 1fr) 20vw;
    grid-template-rows: auto 1fr 3em;
    width: 100%;
}

#server-message {
    grid-area: server;
}

main {
    grid-area: carousel;
    display: flex;
    flex-direction: column;
    padding: 5em;
    overflow: hidden;
}

#intro {
    font-weight: bold;
    font-size: 5vh;
}

#description {
    margin-top: 20px;
    font-size: 2vh;
}

footer {
    grid-area: footer;
    color: white;
    background-color: #7c253e;
    display: flex;
    align-items: center;
    justify-content: center;
}

#login-panel {
    grid-area: login;
    background-color: rgb(43, 43, 43);

    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 5em;

    box-shadow: -10px 0 50px rgb(43, 43, 43);
}

#language-selector {
    position: absolute;
    top: 0;
    right: calc(19vw - 45px);
    font-size: 40px;
    color: white;
}

#language-dropdown {
    position: absolute;
    top: 50px;
    right: calc(19vw - 40px);
    margin-right: -20px;
}

#logo {
    height: 12vw;
    position: relative;

    img {
        position: relative;
        height: 10vw;
    }

    &::before {
        content: "";
        background-color: white;
        position: absolute;
        left: calc(50% - 6.1vw);
        top: calc(50% - 7vw);
        width: 12vw;
        height: 12vw;
        border-radius: 6vw;
    }
}

form {
    display: contents;
}

label {
    margin-top: 15px;
    color: white;
    font-weight: bold;
    font-size: 20px;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
}

.input {
    position: relative;
    width: 12vw;
    margin-top: 10px;
    display: flex;
    justify-content: center;
    align-items: center;

    span {
        position: absolute;
        display: block;
        color: #d4d4d4;
        left: 10px;
        font-size: 20px;
    }

    input {
        width: 100%;
        padding: 10px 5px 10px 40px;
        display: block;
        border: 1px solid #ededed;
        border-radius: 4px;
        transition: 0.2s ease-out;
        color: #a1a1a1;

        &:focus {
            padding: 10px 5px 10px 10px;
            outline: 0;
            background-color: var(--primary);
            color: white;
        }
    }
}

.submit {
    margin-top: 15px;
    width: 120px;
    height: 40px;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    background: #fff;
    border: 2px solid var(--primaryBG);
    color: var(--primaryBG);
    font-size: 24px;
    cursor: pointer;
    transition: 0.2s ease-out;

    &:hover,
    &:focus {
        background: var(--primary);
        color: #fff;
        border: 2px solid white;
        outline: 0;
    }
}

#login {
    margin-top: 45px;
}

h4 {
    font-weight: normal;
    color: white;
    text-align: center;
    border-bottom: 1px solid white;
    line-height: 0.1em;
    width: 12vw;
    margin-top: 30px;

    span {
        padding: 0 10px;
        background-color: var(--secondary);
    }
}

a {
    margin: 0 5px;
}

.black {
    color: rgb(43, 43, 43);
}
</style>
