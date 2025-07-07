<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { socket } from "./socket";

interface User {
    name: string;
    email: string;
}

const users = ref<User[]>([]);
const filter = ref("");

onMounted(async () => {
    users.value = (await socket.emitWithAck("Users.List")) as User[];
});

const filteredUsers = computed(() => {
    const filterV = filter.value.toLowerCase();
    return users.value.filter(
        (u) => u.name.toLowerCase().includes(filterV) || u.email?.toLowerCase().includes(filterV),
    );
});
</script>

<template>
    <!-- Users Section -->
    <section class="content-section">
        <!-- <div class="section-header">
            <h1>User Management</h1>
        </div> -->

        <div id="users">
            <div class="header username">Name {{ filter }}</div>
            <div class="header">Email</div>
            <div class="header">Reset password</div>
            <div class="header">Remove user</div>

            <input v-model="filter" class="filter fullWidth" type="text" placeholder="filter name or email" />

            <template v-for="user in filteredUsers" :key="user.name">
                <div class="username">{{ user.name }}</div>
                <div>{{ user.email }}</div>
                <!-- <div class="pointer" @click="reset(user.name)">reset</div>
                <div class="pointer" @click="remove(user.name)">remove</div> -->
            </template>
            <template v-if="filteredUsers.length === 0">
                <div class="fullWidth">No users match the current filter.</div>
            </template>
        </div>
    </section>
</template>

<style scoped lang="scss">
#users {
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
