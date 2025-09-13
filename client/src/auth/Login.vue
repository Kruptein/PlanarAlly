<script setup lang="ts">
import { onMounted, ref } from "vue";
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
const usernamePasswordEnabled = (document.querySelector("meta[name='PA-username-pass']")?.getAttribute("content") ?? "true") === "true";
const hasMail = (document.querySelector("meta[name='PA-mail']")?.getAttribute("content") ?? "true") === "true";
const oidcEnabled = (document.querySelector("meta[name='PA-oidc']")?.getAttribute("content") ?? "false") === "true";
const oidcDomain = document.querySelector("meta[name='PA-oidc-domain']")?.getAttribute("content") ?? "";
const oidcClientId = document.querySelector("meta[name='PA-oidc-client-id']")?.getAttribute("content") ?? "";
const oidcProviderName = document.querySelector("meta[name='PA-oidc-provider']")?.getAttribute("content") ?? "OIDC";


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
async function loginWithOIDC(): Promise<void> {
    // Check if OIDC is properly configured before attempting login
    if (!oidcEnabled) {
        toast.error("OIDC authentication is not enabled.");
        return;
    }
    
    if (!oidcDomain) {
        toast.error("OIDC domain is not configured.");
        return;
    }
    
    if (!oidcClientId) {
        toast.error("OIDC client ID is not configured.");
        return;
    }
    
    // Check the server-side OIDC configuration
    try {
        const configResponse = await http.get("/api/oidc/config");
        
        if (configResponse.ok) {
            const configData = await configResponse.json();
            
            if (!configData.oidc_enabled) {
                toast.error("OIDC authentication is not enabled on the server.");
                return;
            }
            
            if (!configData.oidc_domain) {
                toast.error("OIDC domain is not configured on the server.");
                return;
            }
            
            if (!configData.oidc_client_id) {
                toast.error("OIDC client ID is not configured on the server.");
                return;
            }
        }
    } catch (error) {
        // Silently handle config check errors - fallback to meta tag values
    }
    
    // Proceed with OIDC login attempt
    try {
        // Generate a cryptographically secure random state for security
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const state = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        const redirectUri = window.location.origin + "/auth/callback";
        
        // Store state in localStorage for verification later
        localStorage.setItem('oidc_state', state);
        localStorage.setItem('oidc_redirect_uri', redirectUri);
        
        // Call our backend to get the authorization URL
        const response = await http.postJson("/api/oidc/login", {
            redirect_uri: redirectUri,
            state: state
        });
        
        if (response.ok) {
            const data = (await response.json()) as { auth_url?: string };
            if (data.auth_url) {
                // Redirect to the authorization URL
                window.location.href = data.auth_url;
            } else {
                console.error("No auth_url in response:", data);
                toast.error("Failed to get authorization URL.");
            }
        } else {
            const errorMsg = await getErrorReason(response);
            console.error("OIDC login failed with status:", response.status, "message:", errorMsg);
            toast.error(`OIDC login failed: ${errorMsg}`);
        }
    } catch (error) {
        console.error("OIDC login failed:", error);
        toast.error("Failed to login with OIDC.");
    }
}

// Initialize OIDC if enabled
onMounted(async () => {
    // Check if we're on the callback route with OIDC data
    if (
        route.name === "auth-callback" &&
        typeof route.query.code !== "undefined" &&
        typeof route.query.state !== "undefined"
    ) {
        try {
            // Verify state matches what we stored
            const storedState = localStorage.getItem('oidc_state');
            const storedRedirectUri = localStorage.getItem('oidc_redirect_uri');
            
            if (storedState !== route.query.state) {
                toast.error("Invalid state parameter - possible CSRF attack");
                await router.push("/auth/login");
                return;
            }
            
            // Clean up stored values
            localStorage.removeItem('oidc_state');
            localStorage.removeItem('oidc_redirect_uri');
            
            // Exchange code directly with your backend
            const response = await http.postJson("/api/oidc/exchange", {
                code: route.query.code,
                redirect_uri: storedRedirectUri || (window.location.origin + "/auth/callback")
            });
            
            if (response.ok) {
                const data = (await response.json()) as { username?: string; email?: string };
                // Set user data from server response
                coreStore.setUsername(data.username || "OIDC User");
                coreStore.setAuthenticated(true);
                if (data.email) {
                    coreStore.setEmail(data.email);
                }
                
                // Redirect to intended destination
                const redirectPath = (route.query.redirect as string) ?? "/";
                await router.push(redirectPath);
            } else {
                const errorMsg = await getErrorReason(response);
                toast.error(`OIDC authentication failed: ${errorMsg}`);
                await router.push("/auth/login");
            }
        } catch (error) {
            console.error("OIDC callback failed:", error);
            toast.error(`OIDC authentication failed: ${error}`);
            // Redirect to login on error
            await router.push("/auth/login");
        }
    }
});
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
                    <template v-if="usernamePasswordEnabled">
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
                        <button v-if="allowRegister && usernamePasswordEnabled" type="button" @click="mode = Mode.Register">
                            <img :src="getStaticImg('plus.svg')" />
                            {{ t("auth.login.register") }}
                        </button>
                    </template>
                    <!-- Separator between username/password and OIDC authentication -->
                    <div v-if="usernamePasswordEnabled && oidcEnabled && oidcDomain && oidcClientId" class="auth-separator">
                        <span class="separator-text">{{ t("auth.login.or") }}</span>
                    </div>
                    <!-- Show OIDC button only if OIDC is enabled and properly configured -->
                    <button v-if="oidcEnabled && oidcDomain && oidcClientId" type="button" class="oidc-button" @click="loginWithOIDC">
                        <img :src="getStaticImg('check_small.svg')" />
                        {{ t("auth.login.loginWith", { provider: oidcProviderName || 'OIDC' }) }}
                    </button>
                </template>
                <template v-else-if="mode === Mode.Register && usernamePasswordEnabled">
                    <div id="title">
                        {{ t("auth.login.register") }}
                        <span style="flex-grow: 1"></span>
                        <a href="https://planarally.io" target="blank">
                            <font-awesome-icon icon="book" title="Show documentation" />
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
            &.oidc-button {
                background-color: rgba(219, 0, 59, 1);
                margin-top: 1rem;
        }
    }

    .auth-separator {
        display: flex;
        align-items: center;
        margin: 2rem 0;
        text-align: center;
        
        &::before,
        &::after {
            content: '';
            flex: 1;
            height: 1px;
            background-color: rgba(255, 255, 255, 0.3);
        }
        
        .separator-text {
            padding: 0 1rem;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.1em;
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
}
</style>
