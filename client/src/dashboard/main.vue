<template>
    <div id="formcontainer">
        <form v-if="owned || joined">
            <fieldset>
                <legend class="legend">Your sessions</legend>
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
                <div class="input" v-if="owned.length === 0">No active sessions</div>
            </fieldset>
        </form>
        <h4>
            <span>OR</span>
        </h4>
        <form @submit.prevent="createRoom">
            <fieldset>
                <legend v-if="!owned && !joined" class="legend">Create a session</legend>
                <div v-else class="input">Create a new session</div>
                <div class="input">
                    <input type="text" v-model="newSessionName" name="room_name" placeholder="Session Name" />
                </div>
                <button type="submit" class="submit" title="Create">
                    Create
                </button>
            </fieldset>
        </form>
        <div id="account-options">
            <form @submit.prevent>
                <router-link tag="button" class="submit" title="Account Settings" to="/account">
                    Settings
                </router-link>
            </form>
            <form @submit.prevent>
                <router-link tag="button" class="submit" title="Logout" to="/auth/logout">
                    Logout
                </router-link>
            </form>
        </div>
    </div>
</template>

<script lang="ts">
import axios, { AxiosError, AxiosResponse } from "axios";
import Vue from "vue";
import Component from "vue-class-component";
import { Route } from "vue-router";

import { coreStore } from "@/core/store";

Component.registerHooks(["beforeRouteEnter"]);

@Component
export default class Dashboard extends Vue {
    owned = [];
    joined = [];
    error = "";

    newSessionName = "";

    // eslint-disable-next-line no-empty-pattern
    beforeRouteEnter(to: Route, from: Route, next: ({}) => {}) {
        axios
            .get("/api/rooms")
            .then((response: AxiosResponse) => {
                next((vm: this) => {
                    vm.owned = response.data.owned;
                    vm.joined = response.data.joined;
                });
            })
            .catch((err: AxiosError) => {
                next((vm: this) => {
                    vm.error = err.message;
                });
            });
    }

    createRoom(_event: Event) {
        axios
            .post("/api/rooms", {
                name: this.newSessionName,
            })
            .then((_response: AxiosResponse) => {
                this.$router.push(
                    `/game/${encodeURIComponent(coreStore.username)}/${encodeURIComponent(this.newSessionName)}`,
                );
            })
            .catch((err: AxiosError) => {
                this.error = err.message;
            });
    }
}
</script>

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

a {
    text-decoration: inherit;
    color: inherit;
    width: 100%;
    display: block;
    text-align: center;
    border: 1px solid #ff7052;
}

a:hover {
    background-color: #ff7052;
    color: white;
}

a:first-child {
    border-radius: 10px 10px 0 0;
}

a:last-child {
    border-radius: 0 0 10px 10px;
}

a:only-child {
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
    height: 52px;
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
    padding: 10px 5px 10px 10px;
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
    width: 96px;
    height: 32px;
    display: block;
    margin: 10px;
    background: #fff;
    border-radius: 5px;
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
</style>
