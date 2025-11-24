<script setup lang="ts">
import { ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

import { http } from "../core/http";
import { useModal } from "../core/plugins/modals/plugin";
import { getErrorReason, getValue } from "../core/utils";
import { coreStore } from "../store/core";

const { t } = useI18n();
const modals = useModal();
const router = useRouter();
const toast = useToast();

const email = toRef(coreStore.state, "email");
const username = toRef(coreStore.state, "username");
const changePasswordText = ref(t("settings.AccountSettings.change_pwd"));
const showPasswordFields = ref(false);
const passwordResetField = ref("");
const passwordRepeatField = ref("");

async function setEmail(event: Event): Promise<void> {
    if (event.target === undefined) return;

    const value = getValue(event);
    if ((event.target as HTMLInputElement).checkValidity() && value !== email.value) {
        const result = await http.postJson("/api/users/email", {
            email: value,
        });
        if (result.ok) {
            coreStore.setEmail(value);
            toast.success(t("dashboard.settings.email_changed"));
        } else {
            (event.target as HTMLInputElement).value = coreStore.state.email ?? "";
        }
    }
}

async function changePassword(): Promise<void> {
    if (showPasswordFields.value) {
        if (passwordResetField.value === "") {
            toast.error(t("settings.AccountSettings.no_pwd_msg"));
            return;
        }
        if (passwordRepeatField.value !== passwordResetField.value) {
            toast.error(t("settings.AccountSettings.pwd_not_match"));
            return;
        }
        const response = await http.postJson("/api/users/password", {
            password: passwordResetField.value,
        });
        if (response.ok) {
            hidePasswordChange();
            toast.success("Password changed successfully");
        } else {
            toast.error((await getErrorReason(response)) ?? t("settings.AccountSettings.server_request_error"));
        }
    } else {
        showPasswordFields.value = true;
        changePasswordText.value = t("common.confirm");
    }
}

function hidePasswordChange(): void {
    showPasswordFields.value = false;
    changePasswordText.value = t("settings.AccountSettings.change_pwd");
}

async function deleteAccount(): Promise<void> {
    const result = await modals.confirm(t("settings.AccountSettings.remove_account_msg"));
    if (result === true) {
        const response = await http.postJson("/api/users/delete");
        if (response.ok) {
            coreStore.setAuthenticated(false);
            await router.push("/auth/login");
        } else {
            toast.error(t("settings.AccountSettings.delete_request_error"));
        }
    }
}
</script>

<template>
    <div id="content">
        <div class="title">Account Settings</div>
        <div class="entry subtitle">{{ t("settings.AccountSettings.general") }}</div>
        <div class="entry">
            <label for="name">{{ t("settings.AccountSettings.username") }}</label>
            <input id="name" type="text" :value="username" readonly />
        </div>
        <div class="entry">
            <label for="email">{{ t("settings.AccountSettings.email") }}</label>
            <input
                id="email"
                type="email"
                :value="email"
                :placeholder="t('settings.AccountSettings.no_email_set')"
                @change="setEmail"
            />
        </div>
        <div class="entry subtitle">{{ t("settings.AccountSettings.danger_zone") }}</div>
        <template v-if="showPasswordFields">
            <div class="entry">
                <label for="password-reset">{{ t("settings.AccountSettings.new_pwd") }}</label>
                <div>
                    <input
                        id="password-reset"
                        v-model="passwordResetField"
                        type="password"
                        autocomplete="new-password"
                    />
                </div>
            </div>
            <div class="entry">
                <label for="password-repeat">{{ t("settings.AccountSettings.repeat_pwd") }}</label>
                <div>
                    <input
                        id="password-repeat"
                        v-model="passwordRepeatField"
                        type="password"
                        autocomplete="new-password"
                    />
                </div>
            </div>
        </template>
        <div class="entry">
            <div><button class="go" @click="changePassword">{{ changePasswordText }}</button></div>
            <div><button v-if="showPasswordFields" class="go" @click="hidePasswordChange">{{ t("common.cancel") }}</button></div>
        </div>
        <div class="entry">
            <div><button class="go" @click="deleteAccount">{{ t("settings.AccountSettings.delete_account") }}</button></div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#content {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;

    background-color: rgba(77, 59, 64, 0.6);
    border-radius: 20px;
    padding: 3.75rem;
    padding-right: 2rem; // adjust for scroll bar

    .title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 3.125em;
        color: white;
        border-bottom: 5px solid #ffa8bf;
        font-weight: bold;
        margin-bottom: 2rem;

        > span:last-child {
            color: #ffa8bf;

            &:hover {
                cursor: pointer;
            }
        }
    }

    .subtitle {
        font-size: 2.5em;
        margin-top: 1rem;
    }

    .entry {
        display: flex;
        flex: 1 1.5;
        flex-direction: row;
        flex-wrap: wrap;

        > :first-child {
            flex-grow: 1;
            max-width: 300px;
            flex-shrink: 1;
        }
        /* type= for specificity */
        > input, input[type="password"] {
            width: 310px;
        }
        padding: 1rem;

        label {
            font-size: 2em;
        }
        input {
            height: 3rem;
            font-size: 1.5em;
            padding: 0 1rem;

            &:read-only {
                color: white;
                background: none;
                border: none;
            }
        }
    }

    button {
        margin-top: 1.25rem;
        width: 15rem;
        height: 2.5rem;
        color: white;
        font-size: 1.125em;
        background-color: rgba(137, 0, 37, 1);
        border: 3px solid rgba(219, 0, 59, 1);
        border-radius: 5px;
        box-shadow: 0 0 10px 0 rgba(6, 6, 6, 0.5);

        display: flex;
        align-items: center;
        justify-content: center;

        > span {
            margin-right: 15px;
        }

        &:hover {
            cursor: pointer;
        }
    }
}
</style>
