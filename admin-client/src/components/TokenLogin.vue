<script setup lang="ts">
import { ref } from "@vue/reactivity";
import { useRoute, useRouter } from "vue-router";
import { set_access_token } from "../store";
import { auth_fetch } from "../utils";

const route = useRoute();
const router = useRouter();

const error = ref("");
const token = ref<HTMLInputElement | null>(null);

async function submit(): Promise<void> {
    const button = token.value!;

    const data = await auth_fetch("notifications", { token: button.value });
    if (data.status === 200) {
        error.value = "";
        set_access_token(button.value);
        await router.push((route.query.redirect as string) ?? "/users");
    } else {
        error.value = "AUTHENTICATION FAILED";
    }
}
</script>

<template>
    <div id="tutorial">
        To perform admin operations, you need to authenticate yourself with an
        admin token.
    </div>
    <div id="center">
        <div>AUTH TOKEN</div>
        <div v-if="error" id="error">{{ error }}</div>
        <div style="display: flex">
            <input type="text" ref="token" />
            <input type="button" value="go" @click="submit" />
        </div>
    </div>
</template>

<style lang="scss">
#tutorial {
    display: flex;
    padding: 10px;
}

#error {
    color: red;
    font-weight: bold;
}

#center {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding-top: 50px;
}
</style>
