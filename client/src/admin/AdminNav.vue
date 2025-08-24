<script setup lang="ts">
import { useRouter } from "vue-router";

import { AdminSection } from "./types";

const activeSection = defineModel<AdminSection>("activeSection");

const router = useRouter();

defineEmits<{
    (e: "exit"): void;
}>();

interface Section {
    icon: string;
    label: string;
    section: AdminSection;
    path: string;
}

const navItems: Section[] = [
    // {
    //     icon: "bell",
    //     label: "Notifications",
    //     section: AdminSection.Notifications,
    // },
    {
        icon: "users",
        label: "Users",
        section: AdminSection.Users,
        path: "users",
    },
    {
        icon: "dungeon",
        label: "Campaigns",
        section: AdminSection.Campaigns,
        path: "campaigns",
    },
];

async function activate(section: Section): Promise<void> {
    await router.push({ path: section.path });
}
</script>

<template>
    <aside id="sidebar">
        <div class="sidebar-header">
            <h2>Admin Panel</h2>
        </div>

        <nav class="sidebar-nav">
            <div
                v-for="item in navItems"
                :key="item.section"
                class="nav-item"
                :class="{ 'nav-active': activeSection === item.section }"
                @click="activate(item)"
            >
                <font-awesome-icon :icon="item.icon" class="nav-icon" />
                <span>{{ item.label }}</span>
            </div>
        </nav>

        <div class="sidebar-footer">
            <button class="return-button" @click="$emit('exit')">
                <font-awesome-icon icon="arrow-left" />
                <span>Main App</span>
            </button>
        </div>
    </aside>
</template>

<style scoped lang="scss">
#sidebar {
    width: 16.25rem;
    background-color: rgba(77, 0, 21, 0.8);
    border-radius: 20px;
    margin: 2.5rem;
    display: flex;
    flex-direction: column;
    padding: 1.875rem;

    .sidebar-header {
        margin-bottom: 2rem;
        text-align: center;

        h2 {
            color: #ffa8bf;
            font-size: 1.5em;
            font-weight: bold;
            margin: 0;
        }
    }

    .sidebar-nav {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .nav-item {
            display: flex;
            align-items: center;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            border-bottom: 3px solid transparent;

            &:hover {
                background-color: rgba(219, 0, 59, 0.3);
                border-bottom-color: #ffa8bf;
            }

            &.nav-active {
                background-color: rgba(219, 0, 59, 0.5);
                border-bottom-color: #ffa8bf;
                font-weight: bold;
            }

            .nav-icon {
                margin-right: 0.75rem;
                font-size: 1.2em;
                color: #ffa8bf;
            }

            span {
                font-size: 1.1em;
            }
        }
    }

    .sidebar-footer {
        margin-top: auto;
        padding-top: 1rem;

        .return-button {
            width: 100%;
            padding: 1rem;
            background-color: rgba(137, 0, 37, 1);
            border: 3px solid rgba(219, 0, 59, 1);
            border-radius: 10px;
            color: white;
            font-size: 1em;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;

            &:hover {
                background-color: rgba(219, 0, 59, 1);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(219, 0, 59, 0.3);
            }

            svg {
                margin-right: 0.5rem;
            }
        }
    }
}

@media (max-width: 768px) {
    #sidebar {
        width: auto;
        margin: 1rem;
        border-radius: 15px;
        padding: 1rem;

        .sidebar-nav {
            flex-direction: row;
            overflow-x: auto;

            .nav-item {
                flex-shrink: 0;
                min-width: 120px;
            }
        }
    }
}
</style>
