<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";

import LanguageDropdown from "../core/components/LanguageDropdown.vue";
import { baseAdjust, http } from "../core/http";
import { getErrorReason } from "../core/utils";
import { coreStore } from "../store/core";

enum Mode {
    Login = 0,
    Register = 1,
    ForgotPassword = 2,
    ResetPassword = 3,
}

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const username = ref("");
const password = ref("");
const email = ref("");
const mode = ref(route.query.resetToken !== undefined ? Mode.ResetPassword : Mode.Login);
const emailInput = ref<HTMLInputElement | null>(null);
const resetPending = ref(false);

const showLanguageDropdown = ref(false);
const allowRegister = (document.querySelector("meta[name='PA-signup']")?.getAttribute("content") ?? "true") === "true";
const hasMail = (document.querySelector("meta[name='PA-mail']")?.getAttribute("content") ?? "true") === "true";

function getStaticImg(img: string): string {
    return baseAdjust(`/static/img/${img}`);
}

const image = "background-borderless.png";
const backgroundImage = `url(${getStaticImg(image)})`;

async function login(): Promise<void> {
    const response = await http.postJson("/api/login", {
        username: username.value,
        password: password.value,
    });
    if (response.ok) {
        coreStore.setUsername(username.value);
        coreStore.setAuthenticated(true);
        const data = (await response.json()) as { email?: string };
        if (data.email !== undefined) coreStore.setEmail(data.email);
        await router.push((route.query.redirect as string) ?? "/");
    } else {
        toast.error(await getErrorReason(response));
    }
}

async function register(): Promise<void> {
    const response = await http.postJson("/api/register", {
        username: username.value,
        password: password.value,
        email: email.value,
    });
    if (response.ok) {
        coreStore.setUsername(username.value);
        coreStore.setAuthenticated(true);
        await router.push((route.query.redirect as string) ?? "/");
    } else {
        toast.error(await getErrorReason(response));
    }
}

async function forgotPassword(): Promise<void> {
    resetPending.value = true;
    const response = await http.postJson("/api/forgot-password", {
        email: email.value,
    });
    if (response.ok) {
        email.value = "";
        toast.success(t("auth.login.forgotPasswordSuccess"), { timeout: false });
    } else {
        toast.error(await getErrorReason(response));
    }
    resetPending.value = false;
}

async function resetPassword(): Promise<void> {
    const response = await http.postJson("/api/reset-password", {
        token: route.query.resetToken,
        password: password.value,
    });
    if (response.ok) {
        toast.success(t("auth.login.resetPasswordSuccess"));
        password.value = "";
        mode.value = Mode.Login;
    } else {
        toast.error(t("auth.login.resetPasswordFailed"));
    }
}
</script>

<template>
    <div>
        <div id="background" :style="{ backgroundImage }">
            <img id="icon" :src="getStaticImg('pa_game_icon.png')" alt="PlanarAlly logo" />
        </div>
        <main>
            <form @submit.prevent>
                <template v-if="mode === Mode.Login">
                    <div id="title">
                        LOG INTO PLANARALLY
                        <span style="flex-grow: 1"></span>
                        <a href="https://planarally.io" target="blank">
                            <font-awesome-icon icon="book" title="Show documentation" />
                        </a>
                        <a href="https://discord.gg/mubGnTe" target="blank">
                            <font-awesome-icon :icon="['fab', 'discord']" title="Join the discord server!" />
                        </a>
                        <div style="position: relative">
                            <font-awesome-icon
                                icon="language"
                                title="Change language"
                                @click="showLanguageDropdown = !showLanguageDropdown"
                            />
                            <LanguageDropdown v-if="showLanguageDropdown" id="language-dropdown" />
                        </div>
                    </div>
                    <div class="form-row">
                        <label for="username">{{ t("common.username") }}</label>
                        <input
                            id="username"
                            v-model="username"
                            type="text"
                            autocomplete="username"
                            required
                            autofocus
                        />
                    </div>
                    <div class="form-row">
                        <div style="display: flex; flex-direction: column; gap: 0.5rem">
                            <label for="password">{{ t("common.password") }}</label>
                            <span v-if="hasMail" class="forgot-password note" @click="mode = Mode.ForgotPassword">
                                {{ t("auth.login.forgotPassword") }}
                            </span>
                        </div>
                        <input
                            id="password"
                            v-model="password"
                            type="password"
                            autocomplete="current-password"
                            required
                        />
                    </div>
                    <button type="submit" @click="login">
                        <img :src="getStaticImg('check_small.svg')" />
                        {{ t("auth.login.login") }}
                    </button>
                    <button v-if="allowRegister" type="button" @click="mode = Mode.Register">
                        <img :src="getStaticImg('plus.svg')" />
                        {{ t("auth.login.register") }}
                    </button>
                </template>
                <template v-else-if="mode === Mode.Register">
                    <div id="title">
                        {{ t("auth.login.register") }}
                        <span style="flex-grow: 1"></span>
                        <a href="https://planarally.io" target="blank">
                            <font-awesome-icon icon="book" title="Show documentation" />
                        </a>
                        <a href="https://discord.gg/mubGnTe" target="blank">
                            <font-awesome-icon :icon="['fab', 'discord']" title="Join the discord server!" />
                        </a>
                        <div style="position: relative">
                            <font-awesome-icon
                                icon="language"
                                title="Change language"
                                @click="showLanguageDropdown = !showLanguageDropdown"
                            />
                            <LanguageDropdown v-if="showLanguageDropdown" id="language-dropdown" />
                        </div>
                    </div>
                    <div class="form-row">
                        <label for="username">{{ t("common.username") }}</label>
                        <input
                            id="username"
                            v-model="username"
                            type="text"
                            autocomplete="username"
                            required
                            autofocus
                        />
                    </div>
                    <div class="form-row">
                        <label for="password">{{ t("common.password") }}</label>
                        <input id="password" v-model="password" type="password" autocomplete="new-password" required />
                    </div>
                    <div class="form-row">
                        <label for="email">{{ t("settings.AccountSettings.email") }}</label>
                        <input id="email" v-model="email" type="email" autocomplete="email" />
                    </div>
                    <button type="submit" @click="register">
                        <img :src="getStaticImg('plus.svg')" />
                        {{ t("auth.login.register") }}
                    </button>
                    <button type="button" @click="mode = Mode.Login">
                        <img :src="getStaticImg('min.svg')" />
                        RETURN TO LOGIN
                    </button>
                </template>
                <template v-else-if="mode === Mode.ForgotPassword">
                    <div id="title">
                        {{ t("auth.login.forgotPassword") }}
                    </div>
                    <div id="forgot-password-note" class="note">
                        {{ t("auth.login.forgotPasswordNote1") }}
                        <br />
                        <br />
                        {{ t("auth.login.forgotPasswordNote2") }}
                    </div>
                    <div class="form-row">
                        <label for="email">{{ t("settings.AccountSettings.email") }}</label>
                        <input id="email" ref="emailInput" v-model="email" type="email" autocomplete="email" required />
                    </div>
                    <button
                        type="submit"
                        :disabled="!emailInput?.validity.valid || resetPending"
                        @click="forgotPassword"
                    >
                        {{ t("common.submit") }}
                    </button>
                    <button type="button" @click="mode = Mode.Login">RETURN TO LOGIN</button>
                </template>
                <template v-else-if="mode === Mode.ResetPassword">
                    <div id="title">
                        {{ t("auth.login.resetPassword") }}
                    </div>
                    <div class="note">
                        {{ t("auth.login.resetPasswordNote") }}
                    </div>
                    <div class="form-row">
                        <label for="password">{{ t("common.password") }}</label>
                        <input id="password" v-model="password" type="password" autocomplete="new-password" required />
                    </div>
                    <button type="submit" @click="resetPassword">
                        {{ t("common.submit") }}
                    </button>
                </template>
            </form>
        </main>
    </div>
</template>

<style scoped lang="scss">
$width: max(25vmax, 500px);

#background,
main {
    position: absolute;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    border-radius: 0;
    padding: 0;
    margin: 0;

    color: white;
}

#background {
    background-size: cover;
    display: flex;
    flex-direction: column;
    align-items: center;

    #icon {
        margin-top: 10%;
        width: $width;
    }
}

main {
    background-color: rgba(77, 0, 21, 0.8);
    -webkit-backdrop-filter: blur(15px);
    backdrop-filter: blur(15px);
    border-radius: 0;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    form {
        width: $width;

        display: flex;
        flex-direction: column;

        > * {
            margin-bottom: 2.5rem;
        }

        #title {
            display: flex;

            font-size: 1.5em;

            padding-bottom: 0.5rem;
            border-bottom: calc(5px * 2560 / 1920) solid rgba(219, 0, 59, 1);

            svg {
                padding-left: 10px;
            }
        }

        .form-row {
            display: flex;
            justify-content: space-between;
            align-items: center;

            label {
                height: 1.5rem;
                font-size: 1.2em;
                text-transform: uppercase;
            }

            input {
                width: 65%;
                height: 3.3rem;
                padding: 1rem;

                font-size: 1.6em;
                color: white;
                background-color: rgba(255, 255, 255, 0.1);

                border-color: rgba(255, 255, 255, 0.1);
                border-radius: calc(5px * 2560 / 1920);
            }
        }

        .save-row {
            justify-content: flex-start;

            label {
                flex-grow: 1;
                font-size: 1.6em;
            }

            button {
                width: 6.25rem;
            }
        }

        button {
            height: 3.3rem;
            width: $width;
            background-color: rgba(219, 0, 59, 1);
            border-radius: calc(5px * 2560 / 1920);
            box-shadow: 0 0 calc(10px * 2560 / 1920) 0 rgba(6, 6, 6, 0.5);
            color: white;

            display: flex;
            align-items: center;
            justify-content: center;

            font-size: 1.5em;
            text-transform: uppercase;

            &:hover {
                cursor: pointer;
            }

            img {
                margin-right: 0.42rem;
            }

            &[disabled] {
                opacity: 0.5;
                &:hover {
                    cursor: not-allowed;
                }
            }
        }
    }
}

#language-dropdown {
    position: absolute;
}

.note {
    font-size: 0.8em;
    color: #aaa;
}

.forgot-password {
    &:hover {
        cursor: pointer;
        color: #fff;
    }
}

#forgot-password-note {
    margin-top: -1rem;
    margin-bottom: 1rem;
}
</style>
