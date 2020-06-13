<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Route, NavigationGuard } from "vue-router";

import { coreStore } from "@/core/store";
import { postFetch } from "../core/utils";

Component.registerHooks(["beforeRouteEnter"]);

@Component
export default class Dashboard extends Vue {
    owned = [];
    joined = [];
    error = "";

    newSessionName = "";

    async beforeRouteEnter(to: Route, from: Route, next: Parameters<NavigationGuard>[2]): Promise<void> {
        const response = await fetch("/api/rooms");
        next(async (vm: Vue) => {
            if (response.ok) {
                const data = await response.json();
                (<this>vm).owned = data.owned;
                (<this>vm).joined = data.joined;
            } else {
                (<this>vm).error = response.statusText;
            }
        });
    }

    async createRoom(_event: Event): Promise<void> {
        const response = await postFetch("/api/rooms", {
            name: this.newSessionName,
        });
        if (response.ok) {
            this.$router.push(
                `/game/${encodeURIComponent(coreStore.username)}/${encodeURIComponent(this.newSessionName)}`,
            );
        } else {
            this.error = response.statusText;
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
    <div style="display:contents">
        <div id="formcontainer">
            <form>
                <fieldset>
                    <legend class="legend" v-t="'dashboard.main.your_sessions'"></legend>
                    <div class="input">
                        <router-link
                            v-for="(room, i) in owned"
                            :key="'o-' + i"
                            :to="'/game/' + encodeURIComponent(room[1]) + '/' + encodeURIComponent(room[0])"
                        >
                            {{ room[0] }}
                        </router-link>
                        <router-link
                            v-for="(room, i) in joined"
                            :key="'j-' + i"
                            :to="'/game/' + encodeURIComponent(room[1]) + '/' + encodeURIComponent(room[0])"
                        >
                            {{ room[1] }}/{{ room[0] }}
                        </router-link>
                    </div>
                    <div
                        class="input"
                        v-if="owned.length === 0 && joined.length === 0"
                        v-t="'dashboard.main.no_sessions'"
                    ></div>
                </fieldset>
            </form>
            <h4>
                <span>OR</span>
            </h4>
            <form @submit.prevent="createRoom">
                <fieldset>
                    <legend v-if="!owned && !joined" class="legend" v-t="'dashboard.main.create_session'"></legend>
                    <div v-else class="input" v-t="'dashboard.main.create_new_session'"></div>
                    <div class="input">
                        <input
                            type="text"
                            v-model="newSessionName"
                            name="room_name"
                            :placeholder="$t('dashboard.main.session_name')"
                        />
                        <span>
                            <i aria-hidden="true" class="fab fa-d-and-d"></i>
                        </span>
                    </div>
                    <button type="submit" class="submit" :title="$t('common.create')">
                        <i aria-hidden="true" class="fas fa-arrow-right"></i>
                    </button>
                </fieldset>
            </form>
            <div id="account-options">
                <form @submit.prevent>
                    <router-link
                        tag="button"
                        class="submit"
                        :title="$t('dashboard.main.account_settings')"
                        to="/settings"
                    >
                        <i aria-hidden="true" class="fas fa-cog"></i>
                    </router-link>
                </form>
                <form @submit.prevent>
                    <router-link tag="button" class="submit" :title="$t('dashboard.main.logout')" to="/auth/logout">
                        <i aria-hidden="true" class="fas fa-sign-out-alt"></i>
                    </router-link>
                </form>
            </div>
        </div>
        <div id="version">
            {{ $t("common.server_ver_prefix") }}
            <a :href="githubUrl">{{ version }}</a>
        </div>
    </div>
</template>

<style scoped>
* {
    -ms-box-sizing: border-box;
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
}

#formcontainer a {
    text-decoration: inherit;
    color: inherit;
    width: 100%;
    display: block;
    text-align: center;
    border: 1px solid #ff7052;
}

#formcontainer a:hover {
    background-color: #ff7052;
    color: white;
}

#formcontainer a:first-child {
    border-radius: 10px 10px 0 0;
}

#formcontainer a:last-child {
    border-radius: 0 0 10px 10px;
}

#formcontainer a:only-child {
    border-radius: 10px;
}

#formcontainer {
    margin: auto;
}

form {
    background: #fff;
    border-radius: 4px;
}

.legend {
    position: relative;
    text-align: center;
    width: 100%;
    display: block;
    background: #ff7052;
    padding: 15px;
    color: #fff;
    font-size: 20px;
}

.legend:after {
    content: "";
    opacity: 0.06;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    position: absolute;
}

#account-options {
    display: flex;
    background: #fff;
    border-radius: 4px;
    margin-top: 50px;
    height: 45px;
}

#account-options form {
    background: none;
    border-radius: 0px;
    width: 50%;
}

.input {
    position: relative;
    width: 90%;
    margin: 15px auto;
}

.input span {
    position: absolute;
    display: block;
    color: #d4d4d4;
    left: 10px;
    top: 8px;
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
    /* padding: 10px 5px 10px 10px; */
    outline: 0;
    border-color: #ff7052;
}

.submit {
    width: 45px;
    height: 45px;
    display: block;
    margin: 0 auto -15px auto;
    background: #fff;
    border-radius: 100%;
    border: 1px solid #ff7052;
    color: #ff7052;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0px 0px 0px 7px #fff;
    transition: 0.2s ease-out;
}

.submit:hover,
.submit:focus {
    background: #ff7052;
    color: #fff;
    outline: 0;
}

.feedback {
    position: absolute;
    bottom: -70px;
    width: 100%;
    text-align: center;
    color: #fff;
    background: mediumvioletred;
    padding: 10px 0;
    font-size: 12px;
    /*display: none;*/
    /*opacity: 0;*/
}

.feedback:before {
    bottom: 100%;
    left: 50%;
    border: solid transparent;
    content: "";
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
    border-color: rgba(46, 204, 113, 0);
    border-bottom-color: mediumvioletred;
    border-width: 10px;
    margin-left: -10px;
}

h4 {
    background-color: white;
    width: 100%;
    text-align: center;
    border-bottom: 1px solid #000;
    line-height: 0.1em;
}

h4 span {
    background: #fff;
    padding: 0 10px;
}

#version {
    position: absolute;
    bottom: 15px;
    color: #a1a1a1;
    display: flex;
    justify-content: center;
    width: 100%;
}

#version > a {
    margin-left: 10px;
}
</style>
