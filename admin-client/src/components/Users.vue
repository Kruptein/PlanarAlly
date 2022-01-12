<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { auth_fetch } from "../utils";

const loading = ref(true);
const users = ref<{ name: string; email: string }[]>([]);
const filter = ref("");

const filteredUsers = computed(() => {
    const filterV = filter.value.toLowerCase();
    return users.value.filter(
        (u) =>
            u.name.toLowerCase().includes(filterV) ||
            u.email?.toLowerCase().includes(filterV)
    );
});

onMounted(async () => {
    const data = await auth_fetch("users");
    loading.value = false;
    users.value = await data.json();
});

async function reset(name: string): Promise<void> {
    const ok = window.confirm(
        `Are you sure you want to reset ${name}'s password?`
    );
    if (ok) {
        const data = await auth_fetch(`users/reset`, {
            method: "POST",
            body: JSON.stringify({ name }),
        });
        if (data.status == 200) {
            const newPw = await data.json();
            await navigator.clipboard.writeText(newPw);
            window.alert(
                `New password is: ${newPw}\nMake sure that the user changes it manually\nIt has been copied to your clipboard`
            );
        } else {
            window.alert("Password reset failed");
        }
    }
}

async function remove(name: string): Promise<void> {
    const check = window.prompt(
        `To confirm user "${name}" removal repeat the username below:`
    );
    if (check === name) {
        const data = await auth_fetch(`users/remove`, {
            method: "POST",
            body: JSON.stringify({ name }),
        });
        if (data.status == 200) {
            window.alert("Account removed");
            users.value = users.value.filter((u) => u.name !== name);
        } else {
            window.alert("Account removal failed");
        }
    }
}
</script>

<template>
    <div v-if="loading">Loading Users</div>
    <div id="users" v-else>
        <div class="header username">Name {{ filter }}</div>
        <div class="header">Email</div>
        <div class="header">Reset password</div>
        <div class="header">Remove user</div>

        <input
            class="filter fullWidth"
            v-model="filter"
            type="text"
            placeholder="filter name or email"
        />

        <template v-for="user in filteredUsers">
            <div class="username">{{ user.name }}</div>
            <div>{{ user.email }}</div>
            <div class="pointer" @click="reset(user.name)">reset</div>
            <div class="pointer" @click="remove(user.name)">remove</div>
        </template>
        <template v-if="filteredUsers.length === 0">
            <div class="fullWidth">No users match the current filter.</div>
        </template>
    </div>
</template>

<style lang="scss">
.pointer {
    cursor: pointer;

    &:hover {
        font-weight: bold;
    }
}

#users {
    margin: 50px;
    display: grid;
    grid-template-columns: 1fr 1fr 150px 150px;
    flex-direction: column;

    > div {
        padding-top: 10px;
        padding-bottom: 10px;
        border-bottom: dashed 1px;
    }

    .header {
        font-weight: bold;
        border-bottom: solid 2px;
    }

    .filter {
        padding-top: 10px;
        padding-bottom: 10px;
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .username {
        padding-left: 50px;
        text-align: left;
    }

    .fullWidth {
        grid-column: 1 / 5;
    }
}
</style>
