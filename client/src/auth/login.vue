<template>
    <form @focusin="focusin" @focusout="focusout" @submit.prevent="login">
        <fieldset>
            <legend class="legend">PlanarAlly v{{ version }}</legend>
            <div class="input">
                <input
                    id="username"
                    type="text"
                    name="username"
                    v-model="username"
                    placeholder="Username"
                    autocomplete="username"
                    required
                    autofocus
                />
                <span>
                    <i class="fas fa-user-circle"></i>
                </span>
            </div>

            <div class="input">
                <input
                    id="password"
                    type="password"
                    name="password"
                    v-model="password"
                    placeholder="Password"
                    autocomplete="current-password"
                    required
                />
                <span>
                    <i class="fas fa-lock"></i>
                </span>
            </div>

            <div style="display:flex;">
                <button type="submit" name="login" style="visibility: hidden;display:none;"></button>
                <button type="button" name="register" class="submit" title="Register" @click="register">
                    <i class="fas fa-plus"></i>
                </button>
                <button type="submit" name="login" class="submit" title="Login">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </fieldset>

        <div class="feedback" v-if="error">
            <p class="error">
                <strong>Error:</strong>
                {{ error }}
            </p>
        </div>
    </form>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { coreStore } from "@/core/store";
import { postFetch } from "../core/utils";

@Component
export default class Login extends Vue {
    username = "";
    password = "";
    error = "";

    async login(): Promise<void> {
        const response = await postFetch("/api/login", { username: this.username, password: this.password });
        if (response.ok) {
            coreStore.setUsername(this.username);
            coreStore.setAuthenticated(true);
            const data = await response.json();
            if (data.email) coreStore.setEmail(data.email);
            this.$router.push(<string>this.$route.query.redirect || "/");
        } else {
            this.error = response.statusText;
        }
    }

    async register(): Promise<void> {
        const response = await postFetch("/api/register", { username: this.username, password: this.password });
        if (response.ok) {
            coreStore.setUsername(this.username);
            coreStore.setAuthenticated(true);
            this.$router.push(<string>this.$route.query.redirect || "/");
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
        return coreStore.version;
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

form {
    position: relative;
    top: 50%;
    width: 250px;
    display: table;
    margin: -150px auto 0 auto;
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
    padding: 10px 5px 10px 10px;
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
</style>
