<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Swiper, SwiperSlide } from "vue-awesome-swiper";
import "swiper/css/swiper.css";

import LanguageDropdown from "@/core/components/languageDropdown.vue";

import { coreStore } from "@/core/store";
import { postFetch } from "../core/utils";
import { SwiperOptions } from "swiper";

@Component({
    components: {
        languageDropdown: LanguageDropdown,
        Swiper,
        SwiperSlide,
    },
})
export default class Login extends Vue {
    username = "";
    password = "";
    error = "";

    swiperOptions: SwiperOptions = {
        slidesPerView: 1,
        loop: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
    };

    async login(): Promise<void> {
        const response = await postFetch("/api/login", { username: this.username, password: this.password });
        console.log(response);
        if (response.ok) {
            coreStore.setUsername(this.username);
            coreStore.setAuthenticated(true);
            const data = await response.json();
            if (data.email) coreStore.setEmail(data.email);
            this.$router.push((this.$route.query.redirect as string) || "/");
        } else {
            this.error = response.statusText;
        }
    }

    async register(): Promise<void> {
        const response = await postFetch("/api/register", { username: this.username, password: this.password });
        if (response.ok) {
            coreStore.setUsername(this.username);
            coreStore.setAuthenticated(true);
            this.$router.push((this.$route.query.redirect as string) || "/");
        } else {
            this.error = response.statusText;
        }
    }

    focusin(event: { target?: { nextElementSibling?: HTMLElement } }): void {
        if (event.target && event.target.nextElementSibling) {
            const span = event.target.nextElementSibling;
            span.style.opacity = "0";
        }
    }

    focusout(event: { target?: { nextElementSibling?: HTMLElement } }): void {
        if (event.target && event.target.nextElementSibling) {
            const span = event.target.nextElementSibling;
            span.style.opacity = "1";
        }
    }

    get version(): string {
        return coreStore.version.env;
    }

    get githubUrl(): string {
        const spl = this.version.split("-");
        if (spl.length > 1) {
            return "https://github.com/Kruptein/PlanarAlly/commit/" + spl[spl.length - 1].slice(1);
        } else {
            return "https://github.com/Kruptein/PlanarAlly/releases/tag/" + this.version;
        }
    }
}
</script>

<template>
    <div id="page">
        <main>
            <div id="intro">
                <span>Welcome to Planar</span>
                <span style="color: #7c253e;">Ally</span>
                !
            </div>
            <div id="description">
                PlanarAlly is an opensource virtual tabletop that aims to help you and your players discover the various
                fictive worlds out there.
            </div>
            <swiper class="swiper" :options="swiperOptions">
                <swiper-slide>
                    <video autoplay="autoplay" loop="loop" muted="muted">
                        <source src="https://planarally.io/assets/media/vision.8eab5657.webm" type="video/webm" />
                        <source src="https://planarally.io/assets/media/vision.06d14f50.mp4" type="video/mp4" />
                    </video>
                    <div class="carousel-details">
                        Immersive lighting & vision system
                    </div>
                </swiper-slide>
                <swiper-slide>
                    <video autoplay="autoplay" loop="loop" muted="muted">
                        <source src="https://www.planarally.io/assets/0.19.0/floors.webm" type="video/webm" />
                        <source src="https://www.planarally.io/assets/0.19.0/floors.mp4" type="video/mp4" />
                    </video>
                    <div class="carousel-details">
                        Use floors to enhance immersion
                    </div>
                </swiper-slide>
                <div class="swiper-pagination" slot="pagination"></div>
            </swiper>
        </main>
        <footer>
            Need help? Visit our user documentation over on
            <a href="https://planarally.io" target="blank">planarally.io</a>
            or join the community on
            <a href="https://discord.gg/mubGnTe" target="blank">discord!</a>
        </footer>
        <div id="login-panel">
            <div id="logo">
                <img src="/static/favicon.png" id="logo" />
            </div>
            <form @focusin="focusin" @focusout="focusout" @submit.prevent="login">
                <label>Username</label>
                <div class="input">
                    <input
                        id="username"
                        type="text"
                        name="username"
                        v-model="username"
                        :placeholder="$t('common.username')"
                        autocomplete="username"
                        required
                        autofocus
                    />
                    <span>
                        <font-awesome-icon icon="user-circle" />
                    </span>
                </div>
                <label>Password</label>
                <div class="input">
                    <input
                        id="password"
                        type="password"
                        name="password"
                        v-model="password"
                        :placeholder="$t('common.password')"
                        autocomplete="current-password"
                        required
                    />
                    <span>
                        <font-awesome-icon icon="lock" />
                    </span>
                </div>
                <button id="login" type="submit" name="login" class="submit" :title="$t('auth.login.login')">
                    <span>enter</span>
                    <font-awesome-icon icon="arrow-right" />
                </button>
            </form>
            <h4><span>OR</span></h4>
            <button class="submit" :title="$t('auth.login.register')">
                <span>register</span>
            </button>
            <div id="empty"></div>
        </div>
    </div>
</template>

<style scoped>
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
    --primaryBG: rgb(43, 43, 43); /*#7c253e;*/
    --secondaryBG: #c4c4c4;
    background-color: var(--secondaryBG);
    grid-template-columns: minmax(0, 1fr) 30vw;
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

.swiper {
    margin-top: 60px;
    width: calc(70vw - 10em);
    min-width: 0;
}

.swiper video {
    height: 50vh;
}

.swiper-pagination >>> .swiper-pagination-bullet-active {
    background-color: var(--primary);
}

.swiper .swiper-slide {
    min-width: 0;
    width: calc(70vw - 10em);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.carousel-details {
    font-weight: bold;
    font-size: 30px;
    margin-top: 10px;
    margin-bottom: 30px;
}

.carousel-details em {
    font-weight: bold;
    text-decoration: underline;
    font-size: x-large;
    display: block;
    margin-bottom: 0.5em;
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
    /* background-color: var(--secondary); */
    background-color: rgb(43, 43, 43);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    /* box-shadow: -10px 0 50px var(--primaryBG); */
    box-shadow: -10px 0 50px rgb(43, 43, 43);
}

#logo {
    height: 12vw;
    position: relative;
}

#logo img {
    height: 10vw;
}

#logo::before {
    content: "";
    background-color: white;
    position: absolute;
    left: calc(50% - 6.1vw);
    top: calc(50% - 7vw);
    width: 12vw;
    height: 12vw;
    border-radius: 6vw;
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
}

.input span {
    position: absolute;
    display: block;
    color: #d4d4d4;
    left: 10px;
    font-size: 20px;
}

.input input {
    width: 100%;
    padding: 10px 5px 10px 40px;
    display: block;
    border: 1px solid #ededed;
    border-radius: 4px;
    transition: 0.2s ease-out;
    color: #a1a1a1;
}

.input input:focus {
    padding: 10px 5px 10px 10px;
    outline: 0;
    border-color: var(--primaryBG);
}

.submit {
    margin-top: 15px;
    /* width: 12vw; */
    /* height: 30px; */
    width: 5vw;
    height: 3vh;
    min-width: 5vw;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    background: #fff;
    border: 2px solid var(--primaryBG);
    color: var(--primaryBG);
    font-size: 24px;
    cursor: pointer;
    transition: 0.2s ease-out;
}

.submit > span {
    display: inline-block;
    /* visibility: hidden; */
}

.submit:hover > span {
    display: none;
    /* visibility: visible; */
}

.submit:hover,
.submit:focus {
    background: var(--primaryBG);
    color: #fff;
    border: 2px solid white;
    outline: 0;
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
}

h4 span {
    padding: 0 10px;
    background-color: var(--secondary);
}

#empty {
    margin-top: 25vh;
}

a {
    margin: 0 5px;
}
</style>
