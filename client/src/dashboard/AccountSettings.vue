<script setup lang="ts">
import { ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { http } from "../core/http";
import { useModal } from "../core/plugins/modals/plugin";
import { getErrorReason, getValue } from "../core/utils";
import { coreStore } from "../store/core";

const { t } = useI18n();
const modals = useModal();
const router = useRouter();

const errorMessage = ref("");
const showPasswordFields = ref(false);
const changePasswordText = ref(t("settings.AccountSettings.change_pwd"));
const passwordResetField = ref("");
const passwordRepeatField = ref("");

const name = toRef(coreStore.state, "username");
const email = toRef(coreStore.state, "email");

async function setEmail(event: Event): Promise<void> {
    if (event.target === undefined) return;
    const value = getValue(event);
    if ((event.target as HTMLInputElement).checkValidity() && value !== email.value) {
        const result = await http.postJson("/api/users/email", {
            email: value,
        });
        if (result.ok) {
            coreStore.setEmail(value);
            // todo: show some kind of notification to notify of success
        } else {
            (event.target as HTMLInputElement).value = coreStore.state.email ?? "";
        }
    }
}

async function changePassword(): Promise<void> {
    if (showPasswordFields.value) {
        if (passwordResetField.value === "") {
            errorMessage.value = t("settings.AccountSettings.no_pwd_msg");
            return;
        }
        if (passwordRepeatField.value !== passwordResetField.value) {
            errorMessage.value = t("settings.AccountSettings.pwd_not_match");
            return;
        }
        const response = await http.postJson("/api/users/password", {
            password: passwordResetField.value,
        });
        if (response.ok) {
            hidePasswordChange();
        } else {
            errorMessage.value = (await getErrorReason(response)) ?? t("settings.AccountSettings.server_request_error");
        }
    } else {
        showPasswordFields.value = true;
        changePasswordText.value = t("common.confirm");
    }
}

function hidePasswordChange(): void {
    errorMessage.value = "";
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
            errorMessage.value = t("settings.AccountSettings.delete_request_error");
        }
    }
}
</script>

<template>
    <div id="content">
        <div class="spanrow header">{{ t("settings.AccountSettings.general") }}</div>
        <div class="row">
            <label for="username">{{ t("settings.AccountSettings.username") }}</label>
            <div>{{ name }}</div>
        </div>
        <div class="row">
            <label for="email">{{ t("settings.AccountSettings.email") }}</label>
            <div>
                <input
                    type="email"
                    id="email"
                    autocomplete="email"
                    :value="email"
                    @change="setEmail"
                    :placeholder="t('settings.AccountSettings.no_email_set')"
                />
            </div>
        </div>
        <div class="spanrow header">{{ t("settings.AccountSettings.danger_zone") }}</div>
        <div class="row" v-if="showPasswordFields">
            <label for="password-reset">{{ t("settings.AccountSettings.new_pwd") }}</label>
            <div>
                <input type="password" id="password-reset" autocomplete="new-password" v-model="passwordResetField" />
            </div>
        </div>
        <div class="row" v-if="showPasswordFields">
            <label for="password-repeat">{{ t("settings.AccountSettings.repeat_pwd") }}</label>
            <div>
                <input type="password" id="password-repeat" autocomplete="new-password" v-model="passwordRepeatField" />
            </div>
        </div>
        <div class="spanrow" v-show="errorMessage" style="display: flex; justify-content: center">
            <span v-show="errorMessage" style="font-weight: bold; margin: 5px 0">{{ errorMessage }}</span>
        </div>
        <div class="row">
            <div>
                <button class="danger" v-if="showPasswordFields" @click="hidePasswordChange">
                    {{ t("common.cancel") }}
                </button>
            </div>
            <div>
                <button class="danger" @click="changePassword">{{ changePasswordText }}</button>
            </div>
        </div>
        <div class="row">
            <div style="grid-column-start: value">
                <button class="danger" @click="deleteAccount">
                    {{ t("settings.AccountSettings.delete_account") }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#content {
    background-color: #7c253e;
    color: white;

    margin: auto;
    padding: 50px;

    display: grid;
    grid-template-columns: [setting] 1fr [value] 1fr [end];
    row-gap: 0.5em;

    input[type="number"],
    input[type="text"],
    input[type="email"],
    input[type="password"] {
        width: 100%;
        padding: 5px;
    }

    button {
        padding: 6px 12px;
        border: 1px solid lightgray;
        border-radius: 0.25em;
        background-color: rgb(235, 235, 228);
    }

    .header {
        font-size: 20px;

        line-height: 0.1em;
        margin: 30px 0;
        font-style: italic;
    }

    .spanrow {
        grid-column: 1 / -1;
    }

    .row {
        display: contents;

        &:first-of-type > * {
            margin-top: 0.5em;
        }
        &:last-of-type > * {
            margin-bottom: 0.5em;
        }
        &:hover > * {
            cursor: pointer;
            text-shadow: 0px 0px 1px black;
        }

        > * {
            display: flex;
            align-items: center;
            padding: 0.5em;
        }
    }

    .danger {
        color: #7c253e;
        &:hover {
            text-shadow: 0px 0px 1px #7c253e;
            cursor: pointer;
        }
    }
}
</style>
