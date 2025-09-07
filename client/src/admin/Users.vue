<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { socket } from "./socket";

interface User {
    name: string;
    email: string;
    lastLogin: string;
}

const users = ref<User[]>([]);
const filter = ref("");

onMounted(async () => {
    const data = (await socket.emitWithAck("Users.List")) as User[];
    users.value = data.sort((a, b) => a.name.localeCompare(b.name));
});

const filteredUsers = computed(() => {
    const filterV = filter.value.toLowerCase();
    return users.value.filter(
        (u) => u.name.toLowerCase().includes(filterV) || u.email?.toLowerCase().includes(filterV),
    );
});

async function reset(name: string): Promise<void> {
    const ok = window.confirm(`Are you sure you want to reset ${name}'s password?`);
    if (ok) {
        const newPw = (await socket.emitWithAck("Users.Reset", name)) as string | false;
        if (newPw !== false) {
            await navigator.clipboard.writeText(newPw);
            window.alert(
                `New password is: ${newPw}\nMake sure that the user changes it manually\nIt has been copied to your clipboard`,
            );
        } else {
            window.alert("Password reset failed");
        }
    }
}

async function remove(name: string): Promise<void> {
    const check = window.prompt(`To confirm user "${name}" removal repeat the username below:`);
    if (check === name) {
        const success = (await socket.emitWithAck("Users.Remove", name)) as boolean;
        if (success) {
            window.alert("Account removed");
            users.value = users.value.filter((u) => u.name !== name);
        } else {
            window.alert("Account removal failed");
        }
    }
}

async function addUser(): Promise<void> {
    const name = window.prompt("Enter the username of the new user:");
    if (name === null || name.length === 0) {
        window.alert("Username cannot be empty");
    } else if (users.value.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
        window.alert("A user with this name already exists");
    } else {
        const newPw = (await socket.emitWithAck("Users.Add", name)) as string | false;
        if (newPw !== false) {
            await navigator.clipboard.writeText(newPw);
            window.alert(
                `New password is: ${newPw}\nMake sure that the user changes it manually\nIt has been copied to your clipboard`,
            );
        } else {
            window.alert("User creation failed");
        }
    }
}
</script>

<template>
    <section>
        <div id="users">
            <div id="users-header">
                <div class="username">Name</div>
                <div>Email</div>
                <div>Last login</div>
                <div>Reset password</div>
                <div>Remove user</div>

                <input
                    v-model="filter"
                    class="filter fullWidth"
                    type="text"
                    autocomplete="off"
                    placeholder="filter name or email"
                />
            </div>

            <div id="users-list">
                <template v-for="user in filteredUsers" :key="user.name">
                    <div class="username">{{ user.name }}</div>
                    <div>{{ user.email }}</div>
                    <div>{{ user.lastLogin }}</div>
                    <div class="pointer" @click="reset(user.name)">reset</div>
                    <div class="pointer" @click="remove(user.name)">remove</div>
                </template>
                <template v-if="filteredUsers.length === 0">
                    <div class="fullWidth">No users match the current filter.</div>
                </template>
            </div>

            <div id="action-bar">
                <div>Total: {{ users.length }}</div>
                <button @click="addUser">Add User</button>
            </div>
        </div>
    </section>
</template>

<style scoped lang="scss">
.pointer:hover {
    cursor: pointer;
}

#users-header,
#users-list {
    display: grid;
    grid-template-columns: 1fr 1fr 150px 150px 150px;
    flex-direction: column;

    > div {
        padding-top: 10px;
        padding-bottom: 10px;
        border-bottom: dashed 1px;
    }

    .filter {
        padding: 10px;
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .username {
        padding-left: 50px;
        text-align: left;
    }

    .fullWidth {
        grid-column: 1 / 6;
    }
}

#action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    margin-top: 1rem;
    border-top: solid 2px;

    font-size: 1.2rem;

    button {
        padding: 0.75rem 1rem;
        background-color: rgba(77, 0, 21);
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-size: inherit;

        &:hover {
            background-color: rgba(219, 0, 59);
            cursor: pointer;
        }
    }
}

#users-header {
    font-weight: bold;
    border-bottom: solid 2px;
}

#users-list {
    max-height: calc(100vh - 23rem);
    overflow-y: auto;
}
</style>
